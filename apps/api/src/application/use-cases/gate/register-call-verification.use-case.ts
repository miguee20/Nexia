import { IGateLogRepository } from '../../../domain/interfaces/gate-log.repository.interface';
import { RegisterCallVerificationDto } from '../../dtos/gate-log.dto';

export class RegisterCallVerificationUseCase {
  constructor(
    private readonly gateLogRepository: IGateLogRepository
  ) {}

  async execute(condominioId: string, guardiaId: string, data: RegisterCallVerificationDto) {
    const estado = data.autorizo_ingreso ? 'AUTORIZADO' : 'DENEGADO';
    const nombreExt = `${data.nombre_visitante} - Llamada a ${data.telefono_contactado} (${estado})`;

    return this.gateLogRepository.create({
      condominio_id: condominioId,
      guardia_id: guardiaId,
      pase_id: null,
      alerta_delivery_id: null,
      nombre_visitante: nombreExt,
      placa_vehiculo: null,
      tipo_registro: 'VERIFICACION_LLAMADA',
      entrada: data.autorizo_ingreso ? new Date() : null, // Solo registramos entrada si autorizó
      salida: null
    });
  }
}
