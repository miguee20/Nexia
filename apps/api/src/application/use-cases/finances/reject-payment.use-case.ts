import { IPagoRepository, PagoEntity } from '../../../domain/interfaces/pago.repository.interface';
import { PaymentNotFoundError, PaymentNotPendingError } from '../../../domain/errors/payment.errors';
import { RejectPaymentDTO } from '../../dtos/payment.dto';

export class RejectPaymentUseCase {
  constructor(private readonly pagoRepository: IPagoRepository) {}

  async execute(condominio_id: string, adminId: string, pagoId: string, dto: RejectPaymentDTO): Promise<PagoEntity> {
    const pago = await this.pagoRepository.findById(pagoId, condominio_id);
    if (!pago) throw new PaymentNotFoundError();
    if (pago.estado !== 'PENDIENTE_REVISION') throw new PaymentNotPendingError();

    // The fee is intentionally left untouched.
    return this.pagoRepository.reject(pago.id, adminId, dto.motivo_rechazo, condominio_id);
  }
}
