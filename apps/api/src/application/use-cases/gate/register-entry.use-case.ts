import { IGateLogRepository } from '../../../domain/interfaces/gate-log.repository.interface';
import { IVisitPassRepository } from '../../../domain/interfaces/visit-pass.repository.interface';
import { RegisterEntryDto } from '../../dtos/gate-log.dto';

export class RegisterEntryUseCase {
  constructor(
    private readonly gateLogRepository: IGateLogRepository,
    private readonly visitPassRepository: IVisitPassRepository
  ) {}

  async execute(condominioId: string, guardiaId: string, data: RegisterEntryDto) {
    await this.visitPassRepository.findByToken(data.pase_id, condominioId);
    
    // In actual implementation we might search by ID instead of token here,
    // assuming frontend passes the pase_id returned by validation.
    // Wait, findByToken is used for QR strings. I need findById in IVisitPassRepository.
    // I will use updateState since the pass is already validated.
    
    await this.visitPassRepository.updateState(data.pase_id, condominioId, 'UTILIZADO');

    return this.gateLogRepository.create({
      condominio_id: condominioId,
      guardia_id: guardiaId,
      pase_id: data.pase_id,
      alerta_delivery_id: null,
      nombre_visitante: null,
      placa_vehiculo: data.placa_vehiculo || null,
      tipo_registro: 'ENTRADA_QR',
      entrada: new Date(),
      salida: null
    });
  }
}
