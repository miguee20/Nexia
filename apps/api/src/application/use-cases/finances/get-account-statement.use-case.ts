import { IPagoRepository, PagoEntity, AccountStatementCuota } from '../../../domain/interfaces/pago.repository.interface';
import { IPropertyRepository } from '../../../domain/interfaces/property.repository.interface';
import { NotFoundError, ValidationError } from '../../../domain/errors';
import { UnauthorizedPaymentActionError } from '../../../domain/errors/payment.errors';
import { Decimal } from '../../../domain/value-objects/money';
import { Actor, feeTotal } from './finance.helpers';

export interface AccountStatementCuotaView extends Omit<AccountStatementCuota, 'pagos'> {
  total: Decimal;
  pagado: Decimal;
  saldo: Decimal;
  vencida: boolean;
}

export interface AccountStatement {
  propiedad: { id: string; identificador: string };
  resumen: {
    cuotas_emitidas: number;
    cuotas_vencidas: number;
    cuotas_pagadas: number;
    total_emitido: Decimal;
    total_pagado: Decimal;
    balance_adeudado: Decimal;
  };
  cuotas: AccountStatementCuotaView[];
  pagos: PagoEntity[];
}

export class GetAccountStatementUseCase {
  constructor(
    private readonly pagoRepository: IPagoRepository,
    private readonly propertyRepository: IPropertyRepository
  ) {}

  async execute(
    condominio_id: string,
    actor: Actor,
    propiedadId?: string,
    now: Date = new Date()
  ): Promise<AccountStatement> {
    const targetId = await this.resolveProperty(condominio_id, actor, propiedadId);

    const statement = await this.pagoRepository.getAccountStatement(targetId, condominio_id);

    let totalEmitido = new Decimal(0);
    let totalPagado = new Decimal(0);
    let balance = new Decimal(0);
    let vencidas = 0;
    let pagadas = 0;
    const pagos: PagoEntity[] = [];

    const cuotas: AccountStatementCuotaView[] = statement.cuotas.map(({ pagos: cuotaPagos, ...cuota }) => {
      const total = feeTotal(cuota);
      const pagado = cuotaPagos
        .filter((p) => p.estado === 'APROBADO')
        .reduce((acc, p) => acc.plus(p.monto), new Decimal(0));
      const isPaid = cuota.estado === 'PAGADA';
      const pendiente = total.minus(pagado);
      const saldo = isPaid || pendiente.isNegative() ? new Decimal(0) : pendiente;
      const vencida = !isPaid && (cuota.estado === 'VENCIDA' || cuota.fecha_vencimiento < now);

      totalEmitido = totalEmitido.plus(total);
      totalPagado = totalPagado.plus(pagado);
      balance = balance.plus(saldo);
      if (vencida) vencidas += 1;
      if (isPaid) pagadas += 1;
      pagos.push(...cuotaPagos);

      return { ...cuota, total, pagado, saldo, vencida };
    });

    pagos.sort((a, b) => b.fecha_pago.getTime() - a.fecha_pago.getTime());

    return {
      propiedad: statement.propiedad,
      resumen: {
        cuotas_emitidas: cuotas.length,
        cuotas_vencidas: vencidas,
        cuotas_pagadas: pagadas,
        total_emitido: totalEmitido,
        total_pagado: totalPagado,
        balance_adeudado: balance,
      },
      cuotas,
      pagos,
    };
  }

  private async resolveProperty(condominio_id: string, actor: Actor, propiedadId?: string): Promise<string> {
    if (actor.rol === 'RESIDENTE') {
      const own = await this.propertyRepository.findAllByResident(actor.userId, condominio_id);
      if (own.length === 0) throw new NotFoundError('No tienes una propiedad asignada');
      if (!propiedadId) return own[0]!.id;
      if (!own.some((p) => p.id === propiedadId)) {
        throw new UnauthorizedPaymentActionError('Solo puedes consultar el estado de cuenta de tu propiedad');
      }
      return propiedadId;
    }

    if (!propiedadId) throw new ValidationError('propiedadId es requerido');
    const property = await this.propertyRepository.findByIdAndCondominio(propiedadId, condominio_id);
    if (!property) throw new NotFoundError('Propiedad no encontrada');
    return property.id;
  }
}
