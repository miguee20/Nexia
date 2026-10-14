import { ICuotaRepository } from '../../../domain/interfaces/cuota.repository.interface';
import { ITenantRepository } from '../../../domain/interfaces/tenant.repository.interface';
import { NotFoundError } from '../../../domain/errors';
import { Decimal } from '../../../domain/value-objects/money';

export type DelinquencyStatus = 'AL_DIA' | 'ALERTA_1_MES' | 'MOROSO';

export interface TrafficLightItem {
  propiedad_id: string;
  identificador: string;
  semaforo: DelinquencyStatus;
  cuotas_vencidas: number;
  cuotas_pendientes: number;
  balance_adeudado: Decimal;
}

export class GetDelinquencyTrafficLightUseCase {
  constructor(
    private readonly cuotaRepository: ICuotaRepository,
    private readonly tenantRepository: ITenantRepository
  ) {}

  async execute(condominio_id: string, now: Date = new Date()): Promise<TrafficLightItem[]> {
    const tenant = await this.tenantRepository.findById(condominio_id);
    if (!tenant) throw new NotFoundError('Condominio no encontrado');

    const mesesParaMoroso = Number(tenant.configuracion?.meses_para_moroso) || 2;
    const rows = await this.cuotaRepository.getDelinquencySummary(condominio_id, mesesParaMoroso, now);

    return rows.map((row) => ({
      propiedad_id: row.propiedad_id,
      identificador: row.identificador,
      semaforo: this.classify(row.cuotas_vencidas, mesesParaMoroso),
      cuotas_vencidas: row.cuotas_vencidas,
      cuotas_pendientes: row.cuotas_pendientes,
      balance_adeudado: row.balance_adeudado,
    }));
  }

  private classify(cuotasVencidas: number, mesesParaMoroso: number): DelinquencyStatus {
    if (cuotasVencidas >= mesesParaMoroso) return 'MOROSO';
    if (cuotasVencidas >= 1) return 'ALERTA_1_MES';
    return 'AL_DIA';
  }
}
