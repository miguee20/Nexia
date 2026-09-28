import { IGateLogRepository } from '../../../domain/interfaces/gate-log.repository.interface';
import { ManualEntryDto } from '../../dtos/gate-log.dto';

export class ManualEntryUseCase {
  constructor(
    private readonly gateLogRepository: IGateLogRepository
  ) {}

  async execute(condominioId: string, guardiaId: string, data: ManualEntryDto) {
    const observacionExt = data.documento_identidad 
      ? `${data.motivo} - Doc: ${data.documento_identidad}${data.observaciones ? ` - ${data.observaciones}` : ''}`
      : `${data.motivo}${data.observaciones ? ` - ${data.observaciones}` : ''}`;

    // Here we can store the observaciones if there was a field, 
    // for now we just create the log.
    return this.gateLogRepository.create({
      condominio_id: condominioId,
      guardia_id: guardiaId,
      pase_id: null,
      alerta_delivery_id: null,
      nombre_visitante: `${data.nombre_visitante} (${observacionExt})`,
      placa_vehiculo: data.placa_vehiculo || null,
      tipo_registro: 'ENTRADA_MANUAL',
      entrada: new Date(),
      salida: null
    });
  }
}
