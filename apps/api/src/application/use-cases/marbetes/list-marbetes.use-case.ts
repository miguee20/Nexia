import { IMarbeteRepository } from '../../../domain/interfaces/marbete.repository.interface';
import { IPropertyRepository } from '../../../domain/interfaces/property.repository.interface';
import { NotFoundError } from '../../../domain/errors';

export class ListMarbetesByPropertyUseCase {
  constructor(
    private readonly marbeteRepository: IMarbeteRepository,
    private readonly propertyRepository: IPropertyRepository
  ) {}

  async execute(propiedad_id: string, condominio_id: string) {
    const property = await this.propertyRepository.findByIdAndCondominio(propiedad_id, condominio_id);
    if (!property) {
      throw new NotFoundError('Propiedad no encontrada en este condominio');
    }

    return this.marbeteRepository.findAllByProperty(propiedad_id, condominio_id);
  }
}
