import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetDelinquencyTrafficLightUseCase } from './get-delinquency-traffic-light.use-case';
import { Decimal } from '../../../domain/value-objects/money';

const TENANT = 'tenant-a';
const now = new Date('2026-10-14T12:00:00Z');

const row = (id: string, vencidas: number, balance: string) => ({
  propiedad_id: id,
  identificador: `Casa ${id}`,
  cuotas_vencidas: vencidas,
  cuotas_pendientes: vencidas,
  balance_adeudado: new Decimal(balance),
});

describe('GetDelinquencyTrafficLightUseCase', () => {
  const cuotaRepo: any = { getDelinquencySummary: vi.fn() };
  const tenantRepo: any = { findById: vi.fn() };
  let useCase: GetDelinquencyTrafficLightUseCase;

  beforeEach(() => {
    vi.resetAllMocks();
    tenantRepo.findById.mockResolvedValue({ id: TENANT, configuracion: { meses_para_moroso: 2 } });
    useCase = new GetDelinquencyTrafficLightUseCase(cuotaRepo, tenantRepo);
  });

  it('classifies green (0), yellow (1) and red (2+)', async () => {
    cuotaRepo.getDelinquencySummary.mockResolvedValue([
      row('a', 0, '0'),
      row('b', 1, '1100.00'),
      row('c', 2, '2200.00'),
      row('d', 5, '5500.00'),
    ]);

    const result = await useCase.execute(TENANT, now);

    expect(cuotaRepo.getDelinquencySummary).toHaveBeenCalledWith(TENANT, 2, now);
    expect(result.map((r) => r.semaforo)).toEqual(['AL_DIA', 'ALERTA_1_MES', 'MOROSO', 'MOROSO']);
    expect(result[1]!.balance_adeudado.toFixed(2)).toBe('1100.00');
  });

  it('respects a custom meses_para_moroso threshold', async () => {
    tenantRepo.findById.mockResolvedValue({ id: TENANT, configuracion: { meses_para_moroso: 3 } });
    cuotaRepo.getDelinquencySummary.mockResolvedValue([row('a', 2, '10'), row('b', 3, '10')]);

    const result = await useCase.execute(TENANT, now);
    expect(result.map((r) => r.semaforo)).toEqual(['ALERTA_1_MES', 'MOROSO']);
  });

  it('defaults to 2 months when not configured', async () => {
    tenantRepo.findById.mockResolvedValue({ id: TENANT, configuracion: {} });
    cuotaRepo.getDelinquencySummary.mockResolvedValue([row('a', 2, '10')]);
    const result = await useCase.execute(TENANT, now);
    expect(result[0]!.semaforo).toBe('MOROSO');
  });
});
