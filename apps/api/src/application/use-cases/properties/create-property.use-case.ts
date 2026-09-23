import { IPropertyRepository } from '../../../domain/interfaces/property.repository.interface';
import { CreatePropertyDTO } from '../../dtos/property.dto';
import { DomainError } from '../../../domain/errors';

export class CreatePropertyUseCase {
  constructor(private readonly propertyRepository: IPropertyRepository) {}

  async execute(condominio_id: string, data: CreatePropertyDTO) {
    // Verificar si ya existe una propiedad con ese identificador en el condominio
    const existing = await this.propertyRepository.findByIdentificadorAndCondominio(data.identificador, condominio_id);
    if (existing) {
      throw new DomainError(`Ya existe una propiedad con el identificador ${data.identificador} en este condominio`, 400);
    }

    const createData: any = {
      condominio_id,
      identificador: data.identificador,
      tipo: data.tipo,
      estado: data.estado,
    };
    
    if (data.area_m2 !== undefined) {
      createData.area_m2 = data.area_m2;
    }

    return this.propertyRepository.create(createData);
  }
}
