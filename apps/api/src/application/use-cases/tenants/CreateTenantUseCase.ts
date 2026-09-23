import { ITenantRepository } from '../../../domain/interfaces/tenant.repository.interface';
import { CreateTenantDTO } from '../../dtos/tenant.dto';

export class CreateTenantUseCase {
  constructor(private tenantRepository: ITenantRepository) {}

  async execute(dto: CreateTenantDTO) {
    const defaultConfig = {
      modulos: {
        garita_qr: true,
        finanzas: true,
        amenidades: true,
        marbetes: false,
      },
      politicas: {
        dia_corte_cuota: 5,
        monto_cuota_base: 0,
        recargo_mora_porcentaje: 10,
        meses_para_moroso: 2,
        bloquear_visitas_morosos: true,
        vigencia_pase_qr_horas: 8,
        vigencia_alerta_delivery_horas: 2,
        moneda: 'GTQ',
      }
    };

    return this.tenantRepository.create({
      nombre: dto.nombre,
      direccion: dto.direccion,
      configuracion: defaultConfig,
    });
  }
}
