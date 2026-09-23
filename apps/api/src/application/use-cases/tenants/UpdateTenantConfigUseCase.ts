import { ITenantRepository } from '../../../domain/interfaces/tenant.repository.interface';
import { UpdateTenantConfigDTO } from '../../dtos/tenant.dto';
import { NotFoundError } from '../../../domain/errors';

export class UpdateTenantConfigUseCase {
  constructor(private tenantRepository: ITenantRepository) {}

  async execute(id: string, dto: UpdateTenantConfigDTO) {
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) {
      throw new NotFoundError('Condominio no encontrado');
    }

    const currentConfig = tenant.configuracion || {};
    const newConfig = {
      ...currentConfig,
      modulos: {
        ...(currentConfig.modulos || {}),
        ...(dto.modulos || {})
      },
      politicas: {
        ...(currentConfig.politicas || {}),
        ...(dto.politicas || {})
      }
    };

    return this.tenantRepository.updateConfig(id, newConfig);
  }
}
