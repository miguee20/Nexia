import { IMarbeteRepository } from '../../../domain/interfaces/marbete.repository.interface';
import { ITenantRepository } from '../../../domain/interfaces/tenant.repository.interface';
import { IVehicleRepository } from '../../../domain/interfaces/vehicle.repository.interface';
import { IssueMarbeteDTO } from '../../dtos/marbete.dto';
import { NotFoundError } from '../../../domain/errors';

export class IssueMarbeteUseCase {
  constructor(
    private readonly marbeteRepository: IMarbeteRepository,
    private readonly vehicleRepository: IVehicleRepository,
    private readonly tenantRepository: ITenantRepository
  ) {}

  async execute(condominio_id: string, data: IssueMarbeteDTO) {
    const vehicle = await this.vehicleRepository.findById(data.vehiculo_id, condominio_id);
    if (!vehicle) {
      throw new NotFoundError('Vehículo no encontrado');
    }

    const tenant = await this.tenantRepository.findById(condominio_id);
    if (!tenant) {
      throw new NotFoundError('Condominio no encontrado');
    }

    // Calcular vigencia
    const fechaEmision = new Date();
    const fechaVencimiento = new Date();
    if (data.periodo === 'MENSUAL') {
      fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 1);
    } else if (data.periodo === 'ANUAL') {
      fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + 1);
    } else {
      fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 1); // fallback
    }

    // Generar código pseudo-aleatorio o secuencial
    const currentYear = fechaEmision.getFullYear();
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const codigo = `MRB-${currentYear}-${randomCode}`;

    // Validar si es extra
    const activeCount = await this.marbeteRepository.countActiveByProperty(vehicle.propiedad_id, condominio_id);
    const limit = tenant.configuracion?.marbetes_incluidos_por_propiedad !== undefined 
      ? Number(tenant.configuracion.marbetes_incluidos_por_propiedad) 
      : 2;
    const es_extra = activeCount >= limit;

    const marbeteData = {
      condominio_id,
      propiedad_id: vehicle.propiedad_id,
      vehiculo_id: vehicle.id,
      codigo,
      fecha_emision: fechaEmision,
      fecha_vencimiento: fechaVencimiento,
      es_extra,
      estado: 'ACTIVO',
    };

    if (es_extra) {
      const costoExtra = tenant.configuracion?.costo_marbete_extra !== undefined
        ? Number(tenant.configuracion.costo_marbete_extra)
        : 50;
      
      const cuotaData = {
        condominio_id,
        propiedad_id: vehicle.propiedad_id,
        concepto: `Marbete vehicular adicional (Placa: ${vehicle.placa})`,
        monto_original: costoExtra,
        fecha_emision: fechaEmision,
        fecha_vencimiento: fechaVencimiento,
        estado: 'PENDIENTE',
      };

      return this.marbeteRepository.createWithExtraFee(marbeteData, cuotaData);
    }

    return this.marbeteRepository.create(marbeteData);
  }
}
