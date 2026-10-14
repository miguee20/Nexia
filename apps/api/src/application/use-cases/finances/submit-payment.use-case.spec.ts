import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubmitPaymentUseCase } from './submit-payment.use-case';
import { Decimal } from '../../../domain/value-objects/money';
import { FeeNotFoundError } from '../../../domain/errors/fee.errors';
import {
  FeeAlreadyPaidError,
  PaymentAmountMismatchError,
  UnauthorizedPaymentActionError,
} from '../../../domain/errors/payment.errors';

const TENANT = 'tenant-a';
const resident = { userId: 'user-1', rol: 'RESIDENTE' };
const dto = {
  cuota_id: '11111111-1111-4111-8111-111111111111',
  monto: '500.00',
  referencia_bancaria: 'BAN-123',
  comprobante_url: 'https://files.example.com/receipt.png',
  fecha_pago: '2026-10-10',
};

const cuota = (estado = 'PENDIENTE') => ({
  id: dto.cuota_id,
  propiedad_id: 'prop-1',
  estado,
  monto_original: new Decimal('1000.00'),
  monto_recargo: new Decimal('100.00'),
});

describe('SubmitPaymentUseCase', () => {
  const pagoRepo: any = { create: vi.fn(), sumApprovedByCuota: vi.fn() };
  const cuotaRepo: any = { findById: vi.fn() };
  const propertyRepo: any = { findByIdAndCondominio: vi.fn() };
  let useCase: SubmitPaymentUseCase;

  beforeEach(() => {
    vi.resetAllMocks();
    cuotaRepo.findById.mockResolvedValue(cuota());
    propertyRepo.findByIdAndCondominio.mockResolvedValue({ id: 'prop-1', propietario_id: 'user-1', inquilino_id: null });
    pagoRepo.sumApprovedByCuota.mockResolvedValue(new Decimal(0));
    pagoRepo.create.mockImplementation(async (p: any) => ({ id: 'pago-1', ...p }));
    useCase = new SubmitPaymentUseCase(pagoRepo, cuotaRepo, propertyRepo);
  });

  it('registers a payment in PENDIENTE_REVISION scoped to the tenant', async () => {
    const pago = await useCase.execute(TENANT, resident, dto);

    expect(cuotaRepo.findById).toHaveBeenCalledWith(dto.cuota_id, TENANT);
    expect(pagoRepo.create).toHaveBeenCalledTimes(1);
    expect(pagoRepo.create.mock.calls[0][1]).toBe(TENANT);
    expect(pago.estado).toBe('PENDIENTE_REVISION');
    expect(pago.residente_id).toBe('user-1');
    expect(pago.monto.toFixed(2)).toBe('500.00');
  });

  it('rejects when the fee is already paid', async () => {
    cuotaRepo.findById.mockResolvedValue(cuota('PAGADA'));
    await expect(useCase.execute(TENANT, resident, dto)).rejects.toBeInstanceOf(FeeAlreadyPaidError);
    expect(pagoRepo.create).not.toHaveBeenCalled();
  });

  it('rejects when the fee does not exist in the tenant', async () => {
    cuotaRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute(TENANT, resident, dto)).rejects.toBeInstanceOf(FeeNotFoundError);
  });

  it('rejects a resident paying a fee of another property', async () => {
    propertyRepo.findByIdAndCondominio.mockResolvedValue({ id: 'prop-1', propietario_id: 'other', inquilino_id: null });
    await expect(useCase.execute(TENANT, resident, dto)).rejects.toBeInstanceOf(UnauthorizedPaymentActionError);
  });

  it('lets an admin submit on behalf of any property of the tenant', async () => {
    propertyRepo.findByIdAndCondominio.mockResolvedValue(null);
    const pago = await useCase.execute(TENANT, { userId: 'admin-1', rol: 'ADMIN_CONDOMINIO' }, dto);
    expect(pago.residente_id).toBe('admin-1');
  });

  it('rejects an amount greater than the remaining balance (considering approved payments)', async () => {
    pagoRepo.sumApprovedByCuota.mockResolvedValue(new Decimal('700.00')); // remaining 400.00
    await expect(useCase.execute(TENANT, resident, dto)).rejects.toBeInstanceOf(PaymentAmountMismatchError);
  });
});
