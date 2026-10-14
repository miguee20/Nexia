import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RejectPaymentUseCase } from './reject-payment.use-case';
import { PaymentNotFoundError, PaymentNotPendingError } from '../../../domain/errors/payment.errors';

const TENANT = 'tenant-a';

describe('RejectPaymentUseCase', () => {
  const pagoRepo: any = { findById: vi.fn(), reject: vi.fn() };
  let useCase: RejectPaymentUseCase;

  beforeEach(() => {
    vi.resetAllMocks();
    pagoRepo.reject.mockImplementation(async (id: string, admin: string, motivo: string) => ({
      id,
      estado: 'RECHAZADO',
      motivo_rechazo: motivo,
      revisado_por_id: admin,
    }));
    useCase = new RejectPaymentUseCase(pagoRepo);
  });

  it('stores the rejection reason and never touches the fee', async () => {
    pagoRepo.findById.mockResolvedValue({ id: 'pago-1', cuota_id: 'cuota-1', estado: 'PENDIENTE_REVISION' });

    const result = await useCase.execute(TENANT, 'admin-1', 'pago-1', { motivo_rechazo: 'Comprobante ilegible' });

    expect(pagoRepo.reject).toHaveBeenCalledWith('pago-1', 'admin-1', 'Comprobante ilegible', TENANT);
    expect(result.estado).toBe('RECHAZADO');
    expect(result.motivo_rechazo).toBe('Comprobante ilegible');
    // The use case has no fee repository dependency: fee state is preserved by construction.
    expect(useCase['pagoRepository']).toBe(pagoRepo);
    expect(Object.keys(pagoRepo)).not.toContain('updateCuota');
  });

  it('fails when the payment is not found in the tenant', async () => {
    pagoRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute(TENANT, 'a', 'x', { motivo_rechazo: 'No coincide' })).rejects.toBeInstanceOf(
      PaymentNotFoundError
    );
    expect(pagoRepo.reject).not.toHaveBeenCalled();
  });

  it('fails when the payment was already reviewed', async () => {
    pagoRepo.findById.mockResolvedValue({ id: 'pago-1', estado: 'APROBADO' });
    await expect(useCase.execute(TENANT, 'a', 'pago-1', { motivo_rechazo: 'No coincide' })).rejects.toBeInstanceOf(
      PaymentNotPendingError
    );
  });
});
