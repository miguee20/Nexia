import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmitBatchFeesUseCase } from './emit-batch-fees.use-case';
import { DuplicateFeePeriodError, TenantConfigMissingError } from '../../../domain/errors/fee.errors';

const TENANT = 'tenant-a';
const now = new Date('2026-10-14T12:00:00Z');

describe('EmitBatchFeesUseCase', () => {
  const cuotaRepo: any = { findPropertyIdsWithConcept: vi.fn(), createBatch: vi.fn() };
  const propertyRepo: any = { findAllByCondominio: vi.fn() };
  const tenantRepo: any = { findById: vi.fn() };
  let useCase: EmitBatchFeesUseCase;

  beforeEach(() => {
    vi.resetAllMocks();
    tenantRepo.findById.mockResolvedValue({
      id: TENANT,
      configuracion: { monto_cuota_base: 850.75, dia_corte_cuota: 5 },
    });
    propertyRepo.findAllByCondominio.mockResolvedValue({
      data: [{ id: 'p1' }, { id: 'p2' }, { id: 'p3' }],
      total: 3,
    });
    cuotaRepo.findPropertyIdsWithConcept.mockResolvedValue([]);
    cuotaRepo.createBatch.mockImplementation(async (rows: any[]) => ({ count: rows.length }));
    useCase = new EmitBatchFeesUseCase(cuotaRepo, propertyRepo, tenantRepo);
  });

  it('creates one fee per occupied property using tenant base amount and cut day', async () => {
    const result = await useCase.execute(TENANT, { concepto: 'Mantenimiento octubre' }, now);

    expect(propertyRepo.findAllByCondominio).toHaveBeenCalledWith(TENANT, { estado: 'OCUPADA' });
    const rows = cuotaRepo.createBatch.mock.calls[0][0];
    expect(rows).toHaveLength(3);
    expect(rows[0].monto_original.toFixed(2)).toBe('850.75');
    expect(rows[0].fecha_vencimiento.toISOString()).toBe('2026-10-05T00:00:00.000Z');
    expect(rows.every((r: any) => r.condominio_id === TENANT)).toBe(true);
    expect(result).toEqual({ created: 3, skipped: 0, mes: 10, anio: 2026 });
  });

  it('uses monto_override when provided', async () => {
    await useCase.execute(TENANT, { concepto: 'Mantenimiento octubre', monto_override: '1000' }, now);
    expect(cuotaRepo.createBatch.mock.calls[0][0][0].monto_original.toFixed(2)).toBe('1000.00');
  });

  it('skips properties already issued for the period', async () => {
    cuotaRepo.findPropertyIdsWithConcept.mockResolvedValue(['p1']);
    const result = await useCase.execute(TENANT, { concepto: 'Mantenimiento octubre' }, now);

    const rows = cuotaRepo.createBatch.mock.calls[0][0];
    expect(rows.map((r: any) => r.propiedad_id)).toEqual(['p2', 'p3']);
    expect(result.skipped).toBe(1);
    expect(result.created).toBe(2);
  });

  it('throws DuplicateFeePeriodError when every property is already issued', async () => {
    cuotaRepo.findPropertyIdsWithConcept.mockResolvedValue(['p1', 'p2', 'p3']);
    await expect(useCase.execute(TENANT, { concepto: 'Mantenimiento octubre' }, now)).rejects.toBeInstanceOf(
      DuplicateFeePeriodError
    );
    expect(cuotaRepo.createBatch).not.toHaveBeenCalled();
  });

  it('throws TenantConfigMissingError without base amount nor override', async () => {
    tenantRepo.findById.mockResolvedValue({ id: TENANT, configuracion: { dia_corte_cuota: 5 } });
    await expect(useCase.execute(TENANT, { concepto: 'Mantenimiento octubre' }, now)).rejects.toBeInstanceOf(
      TenantConfigMissingError
    );
  });
});
