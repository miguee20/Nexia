import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmitIndividualFeeUseCase } from './emit-individual-fee.use-case';
import { InvalidFeeAmountError } from '../../../domain/errors/fee.errors';
import { NotFoundError } from '../../../domain/errors';
import { Decimal } from '../../../domain/value-objects/money';

const PROP_ID = '11111111-1111-4111-8111-111111111111';
const TENANT = 'tenant-a';

describe('EmitIndividualFeeUseCase', () => {
  const cuotaRepo: any = { create: vi.fn() };
  const propertyRepo: any = { findByIdAndCondominio: vi.fn() };
  let useCase: EmitIndividualFeeUseCase;

  beforeEach(() => {
    vi.resetAllMocks();
    cuotaRepo.create.mockImplementation(async (c: any) => ({ id: 'c1', ...c }));
    useCase = new EmitIndividualFeeUseCase(cuotaRepo, propertyRepo);
  });

  it('emits a fee with Decimal amounts scoped to the tenant', async () => {
    propertyRepo.findByIdAndCondominio.mockResolvedValue({ id: PROP_ID });

    const result = await useCase.execute(TENANT, {
      propiedad_id: PROP_ID,
      concepto: 'Cuota extraordinaria',
      monto: '1500.50',
      fecha_vencimiento: '2026-11-05',
    });

    expect(propertyRepo.findByIdAndCondominio).toHaveBeenCalledWith(PROP_ID, TENANT);
    expect(cuotaRepo.create).toHaveBeenCalledTimes(1);
    expect(result.condominio_id).toBe(TENANT);
    expect(Decimal.isDecimal(result.monto_original)).toBe(true);
    expect(result.monto_original.toFixed(2)).toBe('1500.50');
    expect(result.monto_recargo.toFixed(2)).toBe('0.00');
    expect(result.estado).toBe('PENDIENTE');
  });

  it.each(['0', '-10', 'abc'])('rejects invalid amount %s', async (monto) => {
    await expect(
      useCase.execute(TENANT, {
        propiedad_id: PROP_ID,
        concepto: 'Cuota extraordinaria',
        monto,
        fecha_vencimiento: '2026-11-05',
      })
    ).rejects.toBeInstanceOf(InvalidFeeAmountError);
    expect(cuotaRepo.create).not.toHaveBeenCalled();
  });

  it('fails when the property does not belong to the tenant', async () => {
    propertyRepo.findByIdAndCondominio.mockResolvedValue(null);
    await expect(
      useCase.execute(TENANT, {
        propiedad_id: PROP_ID,
        concepto: 'Cuota extraordinaria',
        monto: '100',
        fecha_vencimiento: '2026-11-05',
      })
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
