import { IGateLogRepository } from '../../../domain/interfaces/gate-log.repository.interface';
import { IDeliveryAlertRepository } from '../../../domain/interfaces/delivery-alert.repository.interface';
import { RegisterDeliveryEntryDto } from '../../dtos/gate-log.dto';

export class RegisterDeliveryUseCase {
  constructor(
    private readonly gateLogRepository: IGateLogRepository,
    private readonly deliveryAlertRepository: IDeliveryAlertRepository
  ) {}

  async execute(condominioId: string, guardiaId: string, data: RegisterDeliveryEntryDto) {
    await this.deliveryAlertRepository.updateState(data.alerta_id, condominioId, 'COMPLETADA');

    return this.gateLogRepository.create({
      condominio_id: condominioId,
      guardia_id: guardiaId,
      pase_id: null,
      alerta_delivery_id: data.alerta_id,
      nombre_visitante: data.nombre_repartidor ? `Repartidor: ${data.nombre_repartidor}` : 'Repartidor de Delivery',
      placa_vehiculo: null,
      tipo_registro: 'DELIVERY',
      entrada: new Date(),
      salida: null // Deliveries just get logged, they leave immediately
    });
  }
}
