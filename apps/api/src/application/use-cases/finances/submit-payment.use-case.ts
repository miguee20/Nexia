import { ICuotaRepository } from '../../../domain/interfaces/cuota.repository.interface';
import { IPagoRepository, PagoEntity } from '../../../domain/interfaces/pago.repository.interface';
import { IPropertyRepository } from '../../../domain/interfaces/property.repository.interface';
import { FeeNotFoundError, } from '../../../domain/errors/fee.errors';
import {
  FeeAlreadyPaidError,
  PaymentAmountMismatchError,
  UnauthorizedPaymentActionError,
} from '../../../domain/errors/payment.errors';
import { parsePositiveMoney } from '../../../domain/value-objects/money';
import { SubmitPaymentDTO } from '../../dtos/payment.dto';
import { Actor, feeTotal } from './finance.helpers';

export class SubmitPaymentUseCase {
  constructor(
    private readonly pagoRepository: IPagoRepository,
    private readonly cuotaRepository: ICuotaRepository,
    private readonly propertyRepository: IPropertyRepository
  ) {}

  async execute(condominio_id: string, actor: Actor, dto: SubmitPaymentDTO): Promise<PagoEntity> {
    const monto = parsePositiveMoney(dto.monto);

    const cuota = await this.cuotaRepository.findById(dto.cuota_id, condominio_id);
    if (!cuota) throw new FeeNotFoundError();
    if (cuota.estado === 'PAGADA') throw new FeeAlreadyPaidError();

    if (actor.rol === 'RESIDENTE') {
      const property = await this.propertyRepository.findByIdAndCondominio(cuota.propiedad_id, condominio_id);
      if (!property || (property.propietario_id !== actor.userId && property.inquilino_id !== actor.userId)) {
        throw new UnauthorizedPaymentActionError('La cuota no pertenece a tu propiedad');
      }
    }

    const pagado = await this.pagoRepository.sumApprovedByCuota(cuota.id, condominio_id);
    const saldo = feeTotal(cuota).minus(pagado);
    if (saldo.lessThanOrEqualTo(0)) throw new FeeAlreadyPaidError();
    if (monto.greaterThan(saldo)) {
      throw new PaymentAmountMismatchError(`El monto excede el saldo pendiente (${saldo.toFixed(2)})`);
    }

    return this.pagoRepository.create(
      {
        cuota_id: cuota.id,
        residente_id: actor.userId,
        monto,
        referencia_bancaria: dto.referencia_bancaria ?? null,
        comprobante_url: dto.comprobante_url,
        estado: 'PENDIENTE_REVISION',
        fecha_pago: new Date(dto.fecha_pago),
      },
      condominio_id
    );
  }
}
