import { PrismaClient, Prisma, EstadoPago, EstadoCuota, Pago } from '@prisma/client';
import {
  IPagoRepository,
  PagoEntity,
  PendingPaymentView,
  AccountStatementResult,
  MonthlyReportResult,
  ReceiptContext,
} from '../../../domain/interfaces/pago.repository.interface';
import { FeeNotFoundError } from '../../../domain/errors/fee.errors';
import { NotFoundError } from '../../../domain/errors';
import { PaymentNotFoundError, PaymentNotPendingError } from '../../../domain/errors/payment.errors';
import { Decimal } from '../../../domain/value-objects/money';

export class PrismaPagoRepository implements IPagoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(pago: Partial<PagoEntity>, condominio_id: string): Promise<PagoEntity> {
    // Tenant scoping: the fee must belong to the caller's condominio
    const cuota = await this.prisma.cuota.findFirst({
      where: { id: pago.cuota_id!, condominio_id },
      select: { id: true },
    });
    if (!cuota) throw new FeeNotFoundError();

    const created = await this.prisma.pago.create({
      data: {
        cuota_id: cuota.id,
        residente_id: pago.residente_id!,
        monto: pago.monto!,
        referencia_bancaria: pago.referencia_bancaria ?? null,
        comprobante_url: pago.comprobante_url ?? null,
        estado: EstadoPago.PENDIENTE_REVISION,
        fecha_pago: pago.fecha_pago ?? new Date(),
      },
    });
    return this.toEntity(created);
  }

  async findById(id: string, condominio_id: string): Promise<PagoEntity | null> {
    const pago = await this.prisma.pago.findFirst({ where: { id, cuota: { condominio_id } } });
    return pago ? this.toEntity(pago) : null;
  }

  async listPending(condominio_id: string): Promise<PendingPaymentView[]> {
    const pagos = await this.prisma.pago.findMany({
      where: { estado: EstadoPago.PENDIENTE_REVISION, cuota: { condominio_id } },
      orderBy: { fecha_pago: 'asc' },
      include: {
        cuota: {
          select: {
            id: true,
            concepto: true,
            monto_original: true,
            monto_recargo: true,
            propiedad_id: true,
            propiedad: { select: { identificador: true } },
          },
        },
        residente: { select: { id: true, nombre_completo: true, email: true } },
      },
    });

    return pagos.map(({ cuota, residente, ...pago }) => ({
      ...this.toEntity(pago),
      cuota: {
        id: cuota.id,
        concepto: cuota.concepto,
        monto_original: cuota.monto_original,
        monto_recargo: cuota.monto_recargo,
        propiedad_id: cuota.propiedad_id,
      },
      residente,
      propiedad_identificador: cuota.propiedad.identificador,
    }));
  }

  async sumApprovedByCuota(cuota_id: string, condominio_id: string): Promise<Decimal> {
    const pagos = await this.prisma.pago.findMany({
      where: { cuota_id, estado: EstadoPago.APROBADO, cuota: { condominio_id } },
      select: { monto: true },
    });
    return pagos.reduce((acc, p) => acc.plus(p.monto), new Decimal(0));
  }

  async approve(
    pagoId: string,
    adminId: string,
    cuotaId: string,
    nuevoEstadoCuota: string,
    condominio_id: string
  ): Promise<PagoEntity> {
    // All-or-nothing: if any step throws, Prisma rolls back the whole transaction
    return this.prisma.$transaction(async (tx) => {
      const approved = await tx.pago.updateMany({
        where: {
          id: pagoId,
          cuota_id: cuotaId,
          estado: EstadoPago.PENDIENTE_REVISION,
          cuota: { condominio_id },
        },
        data: {
          estado: EstadoPago.APROBADO,
          fecha_revision: new Date(),
          revisado_por_id: adminId,
        },
      });
      if (approved.count === 0) throw new PaymentNotPendingError();

      const cuota = await tx.cuota.updateMany({
        where: { id: cuotaId, condominio_id },
        data: { estado: nuevoEstadoCuota as EstadoCuota },
      });
      if (cuota.count === 0) throw new FeeNotFoundError();

      const pago = await tx.pago.findFirst({ where: { id: pagoId, cuota: { condominio_id } } });
      if (!pago) throw new PaymentNotFoundError();
      return this.toEntity(pago);
    });
  }

  async reject(pagoId: string, adminId: string, motivo: string, condominio_id: string): Promise<PagoEntity> {
    const result = await this.prisma.pago.updateMany({
      where: { id: pagoId, estado: EstadoPago.PENDIENTE_REVISION, cuota: { condominio_id } },
      data: {
        estado: EstadoPago.RECHAZADO,
        motivo_rechazo: motivo,
        fecha_revision: new Date(),
        revisado_por_id: adminId,
      },
    });
    if (result.count === 0) throw new PaymentNotPendingError();

    const pago = await this.prisma.pago.findFirst({ where: { id: pagoId, cuota: { condominio_id } } });
    if (!pago) throw new PaymentNotFoundError();
    return this.toEntity(pago);
  }

  async getAccountStatement(propiedadId: string, condominio_id: string): Promise<AccountStatementResult> {
    const propiedad = await this.prisma.propiedad.findFirst({
      where: { id: propiedadId, condominio_id },
      select: {
        id: true,
        identificador: true,
        cuotas: {
          where: { condominio_id },
          orderBy: { fecha_vencimiento: 'asc' },
          include: { pagos: { orderBy: { fecha_pago: 'desc' } } },
        },
      },
    });
    if (!propiedad) throw new NotFoundError('Propiedad no encontrada');

    return {
      propiedad: { id: propiedad.id, identificador: propiedad.identificador },
      cuotas: propiedad.cuotas.map(({ pagos, ...c }) => ({
        id: c.id,
        condominio_id: c.condominio_id,
        propiedad_id: c.propiedad_id,
        concepto: c.concepto,
        monto_original: c.monto_original,
        monto_recargo: c.monto_recargo,
        fecha_emision: c.fecha_emision,
        fecha_vencimiento: c.fecha_vencimiento,
        estado: c.estado,
        pagos: pagos.map((p) => this.toEntity(p)),
      })),
    };
  }

  async getMonthlyReport(condominio_id: string, mes: number, anio: number): Promise<MonthlyReportResult> {
    const inicio = new Date(Date.UTC(anio, mes - 1, 1));
    const fin = new Date(Date.UTC(anio, mes, 1));

    const [emitidas, aprobados, abiertas] = await Promise.all([
      this.prisma.cuota.findMany({
        where: { condominio_id, fecha_emision: { gte: inicio, lt: fin } },
        select: { monto_original: true },
      }),
      this.prisma.pago.findMany({
        where: {
          estado: EstadoPago.APROBADO,
          fecha_revision: { gte: inicio, lt: fin },
          cuota: { condominio_id },
        },
        orderBy: { fecha_revision: 'asc' },
        include: {
          cuota: { select: { id: true, concepto: true, propiedad: { select: { identificador: true } } } },
        },
      }),
      this.prisma.cuota.findMany({
        where: {
          condominio_id,
          estado: { in: [EstadoCuota.PENDIENTE, EstadoCuota.VENCIDA, EstadoCuota.PARCIAL] },
          fecha_vencimiento: { lt: fin },
        },
        select: {
          monto_original: true,
          monto_recargo: true,
          pagos: { where: { estado: EstadoPago.APROBADO }, select: { monto: true } },
        },
      }),
    ]);

    const zero = new Decimal(0);
    const totalEmitido = emitidas.reduce((acc, c) => acc.plus(c.monto_original), zero);
    const totalRecaudado = aprobados.reduce((acc, p) => acc.plus(p.monto), zero);
    const montoMora = abiertas.reduce((acc, c) => {
      const pagado = c.pagos.reduce((s, p) => s.plus(p.monto), zero);
      const saldo = c.monto_original.plus(c.monto_recargo).minus(pagado);
      return saldo.greaterThan(0) ? acc.plus(saldo) : acc;
    }, zero);

    return {
      total_emitido: totalEmitido,
      total_recaudado: totalRecaudado,
      monto_mora: montoMora,
      pagos_conciliados: aprobados.map((p) => ({
        pago_id: p.id,
        cuota_id: p.cuota.id,
        concepto: p.cuota.concepto,
        propiedad_identificador: p.cuota.propiedad.identificador,
        monto: p.monto,
        fecha_revision: p.fecha_revision,
      })),
    };
  }

  async getReceiptContext(pagoId: string, condominio_id: string): Promise<ReceiptContext | null> {
    const pago = await this.prisma.pago.findFirst({
      where: { id: pagoId, cuota: { condominio_id } },
      include: {
        residente: { select: { id: true, nombre_completo: true } },
        cuota: {
          include: {
            propiedad: { select: { identificador: true } },
            condominio: { select: { nombre: true, configuracion: true } },
          },
        },
      },
    });
    if (!pago) return null;

    const { cuota, residente, ...rest } = pago;
    return {
      pago: this.toEntity(rest),
      cuota: {
        id: cuota.id,
        concepto: cuota.concepto,
        monto_original: cuota.monto_original,
        monto_recargo: cuota.monto_recargo,
      },
      residente,
      propiedad_identificador: cuota.propiedad.identificador,
      condominio: { nombre: cuota.condominio.nombre, configuracion: cuota.condominio.configuracion },
    };
  }

  private toEntity(p: Pago): PagoEntity {
    return {
      id: p.id,
      cuota_id: p.cuota_id,
      residente_id: p.residente_id,
      monto: p.monto as Prisma.Decimal,
      referencia_bancaria: p.referencia_bancaria,
      comprobante_url: p.comprobante_url,
      estado: p.estado,
      motivo_rechazo: p.motivo_rechazo,
      fecha_pago: p.fecha_pago,
      fecha_revision: p.fecha_revision,
      revisado_por_id: p.revisado_por_id,
    };
  }
}
