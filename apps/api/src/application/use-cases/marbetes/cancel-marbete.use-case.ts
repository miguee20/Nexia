import { IMarbeteRepository } from '../../../domain/interfaces/marbete.repository.interface';
import { NotFoundError } from '../../../domain/errors';

export class CancelMarbeteUseCase {
  constructor(private readonly marbeteRepository: IMarbeteRepository) {}

  async execute(id: string, condominio_id: string) {
    const marbete = await this.marbeteRepository.findById(id, condominio_id);
    if (!marbete) {
      throw new NotFoundError('Marbete no encontrado');
    }

    return this.marbeteRepository.updateStatus(id, condominio_id, 'CANCELADO');
  }
}
