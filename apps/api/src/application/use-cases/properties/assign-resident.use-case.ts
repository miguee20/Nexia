import { IPropertyRepository } from '../../../domain/interfaces/property.repository.interface';
import { AssignResidentDTO } from '../../dtos/property.dto';
import { NotFoundError } from '../../../domain/errors';

export class AssignResidentUseCase {
  constructor(private readonly propertyRepository: IPropertyRepository) {}

  async execute(id: string, condominio_id: string, data: AssignResidentDTO) {
    const property = await this.propertyRepository.findByIdAndCondominio(id, condominio_id);
    if (!property) {
      throw new NotFoundError('Propiedad no encontrada en este condominio');
    }

    return this.propertyRepository.assignResident(id, condominio_id, data.userId, data.tipo_residencia);
  }
}
