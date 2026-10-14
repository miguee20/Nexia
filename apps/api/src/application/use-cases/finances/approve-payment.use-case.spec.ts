import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApprovePaymentUseCase } from './approve-payment.use-case';
import { PrismaPagoRepository } from '../../../infrastructure/database/prisma/pago.repository';
import { Decimal } from '../../../domain/value-objects/money';
import {
  FeeAlreadyPaidError,
  PaymentAmountMismatchError,
  PaymentNotFoundError,
  PaymentNotPendingError,
} from '../../../domain/errors/payment.errors';

const TENANT = 'tenant-a';

const pago = (monto: string, estado = 'PENDIENTE_REVISION') => ({
  id: 'pago-1',
  cuota_id: 'cuota-1',
  estado,
  monto: new Decimal(monto),
});

const cuota = (estado = 'PENDIENTE') => ({
  id: 'cuota-1',
  estado,
  monto_original: new Decimal('1000.00'),
  monto_recargo: new Decimal('100.50'),
});

describe('ApprovePaymentUseCase', () => {
  const pagoRepo: any = { findById: vi.fn(), sumApprovedByCuota: vi.fn(), approve: vi.fn() };
  const cuotaRepo: any = { findById: vi.fn() };
  let useCase: ApprovePaymentUseCase;

  beforeEach(() => {
    vi.resetAllMocks();
    pagoRepo.sumApprovedByCuota.mockResolvedValue(new Decimal(0));
    pagoRepo.approve.mockResolvedValue({ id: 'pago-1', estado: 'APROBADO' });
    cuotaRepo.findById.mockResolvedValue(cuota());
    useCase = new ApprovePaymentUseCase(pagoRepo, cuotaRepo);
  });

  it('marks the fee PAGADA when the payment covers monto_original + monto_recargo', async () => {
    pagoRepo.findById.mockResolvedValue(pago('1100.50'));
    await useCase.execute(TENANT, 'admin-1', 'pago-1');
    expect(pagoRepo.approve).toHaveBeenCalledWith('pago-1', 'admin-1', 'cuota-1', 'PAGADA', TENANT);
  });

  it('marks the fee PARCIAL on a partial payment', async () => {
    pagoRepo.findById.mockResolvedValue(pago('400.00'));
    await useCase.execute(TENANT, 'admin-1', 'pago-1');
    expect(pagoRepo.approve).toHaveBeenCalledWith('pago-1', 'admin-1', 'cuota-1', 'PARCIAL', TENANT);
  });

  it('marks the fee PAGADA when a payment completes previous partial payments (exact decimals)', async () => {
    cuotaRepo.findById.mockResolvedValue(cuota('PARCIAL'));
    pagoRepo.sumApprovedByCuota.mockResolvedValue(new Decimal('400.10'));
    pagoRepo.findById.mockResolvedValue(pago('700.40')); // 1100.50 - 400.10
    await useCase.execute(TENANT, 'admin-1', 'pago-1');
    expect(pagoRepo.approve.mock.calls[0][3]).toBe('PAGADA');
  });

  it('rejects overpayments', async () => {
    pagoRepo.findById.mockResolvedValue(pago('1100.51'));
    await expect(useCase.execute(TENANT, 'admin-1', 'pago-1')).rejects.toBeInstanceOf(PaymentAmountMismatchError);
    expect(pagoRepo.approve).not.toHaveBeenCalled();
  });

  it('rejects approving a payment already reviewed, missing, or for a paid fee', async () => {
    pagoRepo.findById.mockResolvedValue(pago('10', 'APROBADO'));
    await expect(useCase.execute(TENANT, 'a', 'pago-1')).rejects.toBeInstanceOf(PaymentNotPendingError);

    pagoRepo.findById.mockResolvedValue(null);
    await expect(useCase.execute(TENANT, 'a', 'pago-1')).rejects.toBeInstanceOf(PaymentNotFoundError);

    pagoRepo.findById.mockResolvedValue(pago('10'));
    cuotaRepo.findById.mockResolvedValue(cuota('PAGADA'));
    await expect(useCase.execute(TENANT, 'a', 'pago-1')).rejects.toBeInstanceOf(FeeAlreadyPaidError);
  });

  it('propagates repository failures (nothing is swallowed)', async () => {
    pagoRepo.findById.mockResolvedValue(pago('400.00'));
    pagoRepo.approve.mockRejectedValue(new Error('db down'));
    await expect(useCase.execute(TENANT, 'admin-1', 'pago-1')).rejects.toThrow('db down');
  });
});

describe('PrismaPagoRepository.approve (transactional)', () => {
  /** Minimal in-memory Prisma double: $transaction commits only if the callback succeeds. */
  const buildFakePrisma = (opts: { failCuotaUpdate?: boolean } = {}) => {
    const state = {
      pago: { id: 'pago-1', cuota_id: 'cuota-1', estado: 'PENDIENTE_REVISION', revisado_por_id: null as string | null },
      cuota: { id: 'cuota-1', estado: 'PENDIENTE' },
    };
    const makeTx = (s: typeof state) => ({
      pago: {
        updateMany: vi.fn(async ({ data }: any) => {
          if (s.pago.estado !== 'PENDIENTE_REVISION') return { count: 0 };
          Object.assign(s.pago, { estado: data.estado, revisado_por_id: data.revisado_por_id });
          return { count: 1 };
        }),
        findFirst: vi.fn(async () => ({
          ...s.pago,
          residente_id: 'r1',
          monto: new Decimal('10'),
          referencia_bancaria: null,
          comprobante_url: null,
          motivo_rechazo: null,
          fecha_pago: new Date(),
          fecha_revision: new Date(),
        })),
      },
      cuota: {
        updateMany: vi.fn(async ({ data }: any) => {
          if (opts.failCuotaUpdate) throw new Error('cuota update failed');
          s.cuota.estado = data.estado;
          return { count: 1 };
        }),
      },
    });
    const prisma: any = {
      $transaction: vi.fn(async (cb: any) => {
        const draft = structuredClone(state);
        const result = await cb(makeTx(draft));
        Object.assign(state.pago, draft.pago); // commit
        Object.assign(state.cuota, draft.cuota);
        return result;
      }),
    };
    return { prisma, state };
  };

  it('commits payment approval and fee update together', async () => {
    const { prisma, state } = buildFakePrisma();
    const repo = new PrismaPagoRepository(prisma);

    const result = await repo.approve('pago-1', 'admin-1', 'cuota-1', 'PAGADA', TENANT);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(result.estado).toBe('APROBADO');
    expect(state.pago.estado).toBe('APROBADO');
    expect(state.pago.revisado_por_id).toBe('admin-1');
    expect(state.cuota.estado).toBe('PAGADA');
  });

  it('rolls back the payment approval when the fee update fails', async () => {
    const { prisma, state } = buildFakePrisma({ failCuotaUpdate: true });
    const repo = new PrismaPagoRepository(prisma);

    await expect(repo.approve('pago-1', 'admin-1', 'cuota-1', 'PAGADA', TENANT)).rejects.toThrow(
      'cuota update failed'
    );

    expect(state.pago.estado).toBe('PENDIENTE_REVISION');
    expect(state.pago.revisado_por_id).toBeNull();
    expect(state.cuota.estado).toBe('PENDIENTE');
  });
});
