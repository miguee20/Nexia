import { ITenantRepository } from '../../../domain/interfaces/tenant.repository.interface';

export class ListTenantsUseCase {
  constructor(private tenantRepository: ITenantRepository) {}

  async execute() {
    return this.tenantRepository.findAll();
  }
}
