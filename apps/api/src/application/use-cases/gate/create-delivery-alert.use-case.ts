import { IDeliveryAlertRepository } from '../../../domain/interfaces/delivery-alert.repository.interface';
import { ITenantRepository } from '../../../domain/interfaces/tenant.repository.interface';
import { CreateDeliveryAlertDto } from '../../dtos/gate.dto';

export class CreateDeliveryAlertUseCase {
  constructor(
    private readonly deliveryAlertRepository: IDeliveryAlertRepository,
    private readonly tenantRepository: ITenantRepository
  ) {}

  async execute(condominioId: string, residenteId: string, propiedadId: string, data: CreateDeliveryAlertDto) {
    const tenant = await this.tenantRepository.findById(condominioId);
    if (!tenant) throw new Error('Condominio no encontrado');

    const config = tenant.configuracion || {};
    const vigenciaHoras = config.vigencia_alerta_delivery_horas || 2;

    const fechaExpiracion = new Date();
    fechaExpiracion.setHours(fechaExpiracion.getHours() + vigenciaHoras);

    const alert = await this.deliveryAlertRepository.create({
      condominio_id: condominioId,
      residente_id: residenteId,
      propiedad_id: propiedadId,
      descripcion: data.descripcion,
      nombre_repartidor: data.nombre_repartidor || null,
      fecha_expiracion: fechaExpiracion,
    });

    return alert;
  }
}
