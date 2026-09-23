import { IPropertyRepository } from '../../../domain/interfaces/property.repository.interface';
import { NotFoundError } from '../../../domain/errors';

export class GetPropertyByIdUseCase {
  constructor(private readonly propertyRepository: IPropertyRepository) {}

  async execute(id: string, condominio_id: string) {
    const property = await this.propertyRepository.findByIdAndCondominio(id, condominio_id);
    
    if (!property) {
      throw new NotFoundError('Propiedad no encontrada en este condominio');
    }

    return property;
  }
}
