import { IPropertyRepository } from '../../../domain/interfaces/property.repository.interface';
import { UpdatePropertyDTO } from '../../dtos/property.dto';
import { NotFoundError, DomainError } from '../../../domain/errors';

export class UpdatePropertyUseCase {
  constructor(private readonly propertyRepository: IPropertyRepository) {}

  async execute(id: string, condominio_id: string, data: UpdatePropertyDTO) {
    const existing = await this.propertyRepository.findByIdAndCondominio(id, condominio_id);
    if (!existing) {
      throw new NotFoundError('Propiedad no encontrada en este condominio');
    }

    if (data.identificador && data.identificador !== existing.identificador) {
      const existingByIdentifier = await this.propertyRepository.findByIdentificadorAndCondominio(data.identificador, condominio_id);
      if (existingByIdentifier) {
        throw new DomainError(`Ya existe otra propiedad con el identificador ${data.identificador} en este condominio`, 400);
      }
    }

    const updateData: any = {};
    if (data.identificador !== undefined) updateData.identificador = data.identificador;
    if (data.tipo !== undefined) updateData.tipo = data.tipo;
    if (data.estado !== undefined) updateData.estado = data.estado;
    if (data.area_m2 !== undefined) updateData.area_m2 = data.area_m2;

    return this.propertyRepository.update(id, condominio_id, updateData);
  }
}
