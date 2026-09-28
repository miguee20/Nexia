import { IGateLogRepository } from '../../../domain/interfaces/gate-log.repository.interface';
import { RegisterExitDto } from '../../dtos/gate-log.dto';

export class RegisterExitUseCase {
  constructor(
    private readonly gateLogRepository: IGateLogRepository
  ) {}

  async execute(condominioId: string, data: RegisterExitDto) {
    return this.gateLogRepository.updateExit(data.registro_id, condominioId, new Date(), 'SALIDA_QR');
  }
}
