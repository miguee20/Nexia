import { IVehicleRepository } from '../../../domain/interfaces/vehicle.repository.interface';
import { IPropertyRepository } from '../../../domain/interfaces/property.repository.interface';
import { NotFoundError } from '../../../domain/errors';

export class ListVehiclesByPropertyUseCase {
  constructor(
    private readonly vehicleRepository: IVehicleRepository,
    private readonly propertyRepository: IPropertyRepository
  ) {}

  async execute(propiedad_id: string, condominio_id: string) {
    const property = await this.propertyRepository.findByIdAndCondominio(propiedad_id, condominio_id);
    if (!property) {
      throw new NotFoundError('Propiedad no encontrada en este condominio');
    }

    return this.vehicleRepository.findAllByProperty(propiedad_id, condominio_id);
  }
}
