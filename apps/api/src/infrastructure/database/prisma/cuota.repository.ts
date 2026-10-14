import { PrismaClient, EstadoCuota, Prisma } from '@prisma/client';
import {
  ICuotaRepository,
  CuotaEntity,
  FeeFilters,
  FeePagination,
  DelinquencyRow,
} from '../../../domain/interfaces/cuota.repository.interface';
import { FeeNotFoundError } from '../../../domain/errors/fee.errors';
import { Decimal } from '../../../domain/value-objects/money';

export class PrismaCuotaRepository implements ICuotaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async hasOverdueFees(propiedad_id: string, condominio_id: string, dateLimit: Date): Promise<boolean> {
    const overdueCount = await this.prisma.cuota.count({
      where: {
        propiedad_id,
        condominio_id,
        estado: {
          in: [EstadoCuota.PENDIENTE, EstadoCuota.VENCIDA, EstadoCuota.PARCIAL]
        },
        fecha_vencimiento: {
          lte: dateLimit
        }
      }
    });

    return overdueCount > 0;
  }

  async create(cuota: Partial<CuotaEntity>): Promise<CuotaEntity> {
    const created = await this.prisma.cuota.create({
      data: this.toCreateData(cuota),
    });
    return this.toEntity(created);
  }

  async createBatch(cuotas: Partial<CuotaEntity>[]): Promise<{ count: number }> {
    const result = await this.prisma.cuota.createMany({
      data: cuotas.map((c) => this.toCreateData(c)),
    });
    return { count: result.count };
  }

  async findById(id: string, condominio_id: string): Promise<CuotaEntity | null> {
    const cuota = await this.prisma.cuota.findFirst({ where: { id, condominio_id } });
    return cuota ? this.toEntity(cuota) : null;
  }

  async findOverduePending(condominio_id: string, dateLimit: Date): Promise<CuotaEntity[]> {
    const cuotas = await this.prisma.cuota.findMany({
      where: {
        condominio_id,
        estado: EstadoCuota.PENDIENTE,
        fecha_vencimiento: { lt: dateLimit },
      },
      orderBy: { fecha_vencimiento: 'asc' },
    });
    return cuotas.map((c) => this.toEntity(c));
  }

  async updateRecargo(
    id: string,
    condominio_id: string,
    monto_recargo: Decimal,
    estado?: string
  ): Promise<CuotaEntity> {
    const result = await this.prisma.cuota.updateMany({
      where: { id, condominio_id },
      data: {
        monto_recargo,
        ...(estado && { estado: estado as EstadoCuota }),
      },
    });
    if (result.count === 0) throw new FeeNotFoundError();

    const updated = await this.prisma.cuota.findFirst({ where: { id, condominio_id } });
    if (!updated) throw new FeeNotFoundError();
    return this.toEntity(updated);
  }

  async getDelinquencySummary(condominio_id: string, _mesesParaMoroso: number, now: Date): Promise<DelinquencyRow[]> {
    // JOIN propiedad -> cuotas (+ approved payments for partial fees), aggregated with Decimal
    const properties = await this.prisma.propiedad.findMany({
      where: { condominio_id, estado: 'OCUPADA' },
      orderBy: { identificador: 'asc' },
      select: {
        id: true,
        identificador: true,
        cuotas: {
          where: {
            condominio_id,
            estado: { in: [EstadoCuota.PENDIENTE, EstadoCuota.VENCIDA, EstadoCuota.PARCIAL] },
          },
          select: {
            estado: true,
            monto_original: true,
            monto_recargo: true,
            fecha_vencimiento: true,
            pagos: { where: { estado: 'APROBADO' }, select: { monto: true } },
          },
        },
      },
    });

    return properties.map((p) => {
      let vencidas = 0;
      let balance = new Decimal(0);

      for (const c of p.cuotas) {
        if (c.estado === EstadoCuota.VENCIDA || c.fecha_vencimiento < now) vencidas += 1;

        const pagado = c.pagos.reduce((acc, pago) => acc.plus(pago.monto), new Decimal(0));
        const saldo = c.monto_original.plus(c.monto_recargo).minus(pagado);
        if (saldo.greaterThan(0)) balance = balance.plus(saldo);
      }

      return {
        propiedad_id: p.id,
        identificador: p.identificador,
        cuotas_vencidas: vencidas,
        cuotas_pendientes: p.cuotas.length,
        balance_adeudado: balance,
      };
    });
  }

  async listFees(condominio_id: string, filters: FeeFilters, pagination?: FeePagination): Promise<CuotaEntity[]> {
    const cuotas = await this.prisma.cuota.findMany({
      where: this.buildWhere(condominio_id, filters),
      orderBy: { fecha_vencimiento: 'desc' },
      ...(pagination?.limit !== undefined && { take: pagination.limit }),
      ...(pagination?.offset !== undefined && { skip: pagination.offset }),
    });
    return cuotas.map((c) => this.toEntity(c));
  }

  async countFees(condominio_id: string, filters: FeeFilters): Promise<number> {
    return this.prisma.cuota.count({ where: this.buildWhere(condominio_id, filters) });
  }

  async findPropertyIdsWithConcept(
    condominio_id: string,
    concepto: string,
    desde: Date,
    hasta: Date
  ): Promise<string[]> {
    const rows = await this.prisma.cuota.findMany({
      where: {
        condominio_id,
        concepto,
        fecha_emision: { gte: desde, lt: hasta },
      },
      select: { propiedad_id: true },
      distinct: ['propiedad_id'],
    });
    return rows.map((r) => r.propiedad_id);
  }

  private buildWhere(condominio_id: string, filters: FeeFilters): Prisma.CuotaWhereInput {
    const where: Prisma.CuotaWhereInput = { condominio_id };
    if (filters.propiedad_id) where.propiedad_id = filters.propiedad_id;
    if (filters.estado) where.estado = filters.estado as EstadoCuota;
    if (filters.fecha_desde || filters.fecha_hasta) {
      where.fecha_vencimiento = {
        ...(filters.fecha_desde && { gte: filters.fecha_desde }),
        ...(filters.fecha_hasta && { lte: filters.fecha_hasta }),
      };
    }
    return where;
  }

  private toCreateData(c: Partial<CuotaEntity>): Prisma.CuotaUncheckedCreateInput {
    return {
      condominio_id: c.condominio_id!,
      propiedad_id: c.propiedad_id!,
      concepto: c.concepto!,
      monto_original: c.monto_original!,
      monto_recargo: c.monto_recargo ?? new Decimal(0),
      fecha_emision: c.fecha_emision ?? new Date(),
      fecha_vencimiento: c.fecha_vencimiento!,
      ...(c.estado && { estado: c.estado as EstadoCuota }),
    };
  }

  private toEntity(c: {
    id: string;
    condominio_id: string;
    propiedad_id: string;
    concepto: string;
    monto_original: Decimal;
    monto_recargo: Decimal;
    fecha_emision: Date;
    fecha_vencimiento: Date;
    estado: string;
  }): CuotaEntity {
    return {
      id: c.id,
      condominio_id: c.condominio_id,
      propiedad_id: c.propiedad_id,
      concepto: c.concepto,
      monto_original: c.monto_original,
      monto_recargo: c.monto_recargo,
      fecha_emision: c.fecha_emision,
      fecha_vencimiento: c.fecha_vencimiento,
      estado: c.estado,
    };
  }
}
