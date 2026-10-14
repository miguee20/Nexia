import { ICuotaRepository } from '../../../domain/interfaces/cuota.repository.interface';
import { IPagoRepository, PagoEntity } from '../../../domain/interfaces/pago.repository.interface';
import { FeeNotFoundError } from '../../../domain/errors/fee.errors';
import {
  FeeAlreadyPaidError,
  PaymentAmountMismatchError,
  PaymentNotFoundError,
  PaymentNotPendingError,
} from '../../../domain/errors/payment.errors';
import { feeTotal } from './finance.helpers';

export class ApprovePaymentUseCase {
  constructor(
    private readonly pagoRepository: IPagoRepository,
    private readonly cuotaRepository: ICuotaRepository
  ) {}

  async execute(condominio_id: string, adminId: string, pagoId: string): Promise<PagoEntity> {
    const pago = await this.pagoRepository.findById(pagoId, condominio_id);
    if (!pago) throw new PaymentNotFoundError();
    if (pago.estado !== 'PENDIENTE_REVISION') throw new PaymentNotPendingError();

    const cuota = await this.cuotaRepository.findById(pago.cuota_id, condominio_id);
    if (!cuota) throw new FeeNotFoundError();
    if (cuota.estado === 'PAGADA') throw new FeeAlreadyPaidError();

    const yaPagado = await this.pagoRepository.sumApprovedByCuota(cuota.id, condominio_id);
    const saldo = feeTotal(cuota).minus(yaPagado);
    if (saldo.lessThanOrEqualTo(0)) throw new FeeAlreadyPaidError();
    if (pago.monto.greaterThan(saldo)) {
      throw new PaymentAmountMismatchError(`El monto excede el saldo pendiente (${saldo.toFixed(2)})`);
    }

    const nuevoEstadoCuota = pago.monto.greaterThanOrEqualTo(saldo) ? 'PAGADA' : 'PARCIAL';

    // Atomic: payment approval + fee state update happen in a single $transaction inside the repository
    return this.pagoRepository.approve(pago.id, adminId, cuota.id, nuevoEstadoCuota, condominio_id);
  }
}
