import { IPropertyContactRepository } from '../../../domain/interfaces/property-contact.repository.interface';

export class GetPropertyContactUseCase {
  constructor(
    private readonly propertyContactRepository: IPropertyContactRepository
  ) {}

  async execute(condominioId: string, propertyId: string) {
    const contact = await this.propertyContactRepository.findContactInfo(propertyId, condominioId);
    if (!contact) throw new Error('Propiedad no encontrada');
    return contact;
  }
}
