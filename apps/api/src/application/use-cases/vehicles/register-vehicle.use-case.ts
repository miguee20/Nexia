import { IVehicleRepository } from '../../../domain/interfaces/vehicle.repository.interface';
import { ITenantRepository } from '../../../domain/interfaces/tenant.repository.interface';
import { CreateVehicleDTO } from '../../dtos/vehicle.dto';
import { DomainError, NotFoundError } from '../../../domain/errors';
import { IssueMarbeteUseCase } from '../marbetes/issue-marbete.use-case';
import { IPropertyRepository } from '../../../domain/interfaces/property.repository.interface';

export class RegisterVehicleUseCase {
  constructor(
    private readonly vehicleRepository: IVehicleRepository,
    private readonly propertyRepository: IPropertyRepository,
    private readonly tenantRepository: ITenantRepository,
    private readonly issueMarbeteUseCase: IssueMarbeteUseCase
  ) {}

  async execute(propiedad_id: string, condominio_id: string, data: CreateVehicleDTO) {
    // Verificar si la propiedad existe en este condominio
    const property = await this.propertyRepository.findByIdAndCondominio(propiedad_id, condominio_id);
    if (!property) {
      throw new NotFoundError('Propiedad no encontrada en este condominio');
    }

    // Verificar placa duplicada en el condominio
    const existingVehicle = await this.vehicleRepository.findByPlaca(data.placa, condominio_id);
    if (existingVehicle) {
      throw new DomainError(`La placa ${data.placa} ya está registrada en este condominio`, 400);
    }

    const vehicle = await this.vehicleRepository.create({
      condominio_id,
      propiedad_id,
      placa: data.placa,
      marca: data.marca,
      color: data.color,
      modelo: data.modelo || null,
      tipo: data.tipo,
    });

    const tenant = await this.tenantRepository.findById(condominio_id);
    if (!tenant) {
      throw new NotFoundError('Condominio no encontrado');
    }

    const modulos = tenant.configuracion?.modulos || {};
    
    if (modulos.marbetes === true) {
      // Emitir marbete por defecto con periodo MENSUAL (o lo que configure el tenant por defecto)
      const periodo = tenant.configuracion?.periodo_marbete || 'MENSUAL';
      await this.issueMarbeteUseCase.execute(condominio_id, {
        vehiculo_id: vehicle.id,
        periodo: periodo
      });
    }

    return vehicle;
  }
}
