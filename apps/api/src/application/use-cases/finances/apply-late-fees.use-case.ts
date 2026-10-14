import { ICuotaRepository } from '../../../domain/interfaces/cuota.repository.interface';
import { ITenantRepository } from '../../../domain/interfaces/tenant.repository.interface';
import { NotFoundError } from '../../../domain/errors';
import { TenantConfigMissingError } from '../../../domain/errors/fee.errors';
import { Decimal } from '../../../domain/value-objects/money';
import { ApplyLateFeesDTO } from '../../dtos/fee.dto';

export class ApplyLateFeesUseCase {
  constructor(
    private readonly cuotaRepository: ICuotaRepository,
    private readonly tenantRepository: ITenantRepository
  ) {}

  async execute(
    condominio_id: string,
    dto: ApplyLateFeesDTO = {},
    now: Date = new Date()
  ): Promise<{ updated: number; fecha_corte: Date }> {
    const tenant = await this.tenantRepository.findById(condominio_id);
    if (!tenant) throw new NotFoundError('Condominio no encontrado');

    const rawPct = tenant.configuracion?.recargo_mora_porcentaje;
    if (rawPct === undefined || rawPct === null) {
      throw new TenantConfigMissingError('recargo_mora_porcentaje no configurado');
    }
    const porcentaje = new Decimal(String(rawPct));
    if (porcentaje.isNaN() || porcentaje.isNegative()) {
      throw new TenantConfigMissingError('recargo_mora_porcentaje inválido');
    }

    const fechaCorte = dto.fecha_corte ? new Date(dto.fecha_corte) : now;
    const overdue = await this.cuotaRepository.findOverduePending(condominio_id, fechaCorte);

    for (const cuota of overdue) {
      const recargo = new Decimal(cuota.monto_original)
        .mul(porcentaje)
        .div(100)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      await this.cuotaRepository.updateRecargo(cuota.id, condominio_id, recargo, 'VENCIDA');
    }

    return { updated: overdue.length, fecha_corte: fechaCorte };
  }
}
