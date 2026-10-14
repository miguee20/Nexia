import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApplyLateFeesUseCase } from './apply-late-fees.use-case';
import { Decimal } from '../../../domain/value-objects/money';
import { TenantConfigMissingError } from '../../../domain/errors/fee.errors';

const TENANT = 'tenant-a';
const now = new Date('2026-10-14T12:00:00Z');

describe('ApplyLateFeesUseCase', () => {
  const cuotaRepo: any = { findOverduePending: vi.fn(), updateRecargo: vi.fn() };
  const tenantRepo: any = { findById: vi.fn() };
  let useCase: ApplyLateFeesUseCase;

  beforeEach(() => {
    vi.resetAllMocks();
    tenantRepo.findById.mockResolvedValue({ id: TENANT, configuracion: { recargo_mora_porcentaje: 10 } });
    useCase = new ApplyLateFeesUseCase(cuotaRepo, tenantRepo);
  });

  it('applies the tenant percentage with exact decimals and marks as VENCIDA', async () => {
    cuotaRepo.findOverduePending.mockResolvedValue([
      { id: 'c1', monto_original: new Decimal('1000.00') },
      { id: 'c2', monto_original: new Decimal('333.33') },
    ]);

    const result = await useCase.execute(TENANT, {}, now);

    expect(cuotaRepo.findOverduePending).toHaveBeenCalledWith(TENANT, now);
    expect(cuotaRepo.updateRecargo).toHaveBeenCalledTimes(2);
    const [id1, tenant1, recargo1, estado1] = cuotaRepo.updateRecargo.mock.calls[0];
    expect([id1, tenant1, estado1]).toEqual(['c1', TENANT, 'VENCIDA']);
    expect(recargo1.toFixed(2)).toBe('100.00');
    // 333.33 * 10% = 33.333 -> 33.33
    expect(cuotaRepo.updateRecargo.mock.calls[1][2].toFixed(2)).toBe('33.33');
    expect(result.updated).toBe(2);
  });

  it('avoids float drift (0.1 + 0.2 style) when computing surcharge', async () => {
    tenantRepo.findById.mockResolvedValue({ id: TENANT, configuracion: { recargo_mora_porcentaje: 7.5 } });
    cuotaRepo.findOverduePending.mockResolvedValue([{ id: 'c1', monto_original: new Decimal('0.30') }]);

    await useCase.execute(TENANT, {}, now);
    // 0.30 * 7.5% = 0.0225 -> 0.02 (half up)
    expect(cuotaRepo.updateRecargo.mock.calls[0][2].toFixed(2)).toBe('0.02');
  });

  it('honors fecha_corte from the DTO', async () => {
    cuotaRepo.findOverduePending.mockResolvedValue([]);
    await useCase.execute(TENANT, { fecha_corte: '2026-09-01T00:00:00.000Z' }, now);
    expect(cuotaRepo.findOverduePending).toHaveBeenCalledWith(TENANT, new Date('2026-09-01T00:00:00.000Z'));
  });

  it('throws when the tenant has no surcharge percentage configured', async () => {
    tenantRepo.findById.mockResolvedValue({ id: TENANT, configuracion: {} });
    await expect(useCase.execute(TENANT, {}, now)).rejects.toBeInstanceOf(TenantConfigMissingError);
  });
});
