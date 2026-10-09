import { IPropertyContactRepository } from '../../../domain/interfaces/property-contact.repository.interface';

const MAX_SUGGESTIONS = 8;

export class SearchPropertiesUseCase {
  constructor(
    private readonly propertyContactRepository: IPropertyContactRepository
  ) {}

  async execute(condominioId: string, query: string) {
    return this.propertyContactRepository.searchByIdentifier(query.trim(), condominioId, MAX_SUGGESTIONS);
  }
}
