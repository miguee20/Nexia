import { IPropertyRepository, PropertyFilters } from '../../../domain/interfaces/property.repository.interface';

export class ListPropertiesUseCase {
  constructor(private readonly propertyRepository: IPropertyRepository) {}

  async execute(condominio_id: string, filters?: PropertyFilters) {
    return this.propertyRepository.findAllByCondominio(condominio_id, filters);
  }
}
