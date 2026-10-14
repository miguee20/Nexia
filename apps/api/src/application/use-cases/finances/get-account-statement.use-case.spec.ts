import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetAccountStatementUseCase } from './get-account-statement.use-case';
import { Decimal } from '../../../domain/value-objects/money';
import { UnauthorizedPaymentActionError } from '../../../domain/errors/payment.errors';
import { NotFoundError } from '../../../domain/errors';

const TENANT = 'tenant-a';
const now = new Date('2026-10-14T12:00:00Z');

const pago = (id: string, monto: string, estado: string, fecha: string) => ({
  id,
  monto: new Decimal(monto),
  estado,
  fecha_pago: new Date(fecha),
});

const cuota = (id: string, estado: string, original: string, recargo: string, venc: string, pagos: any[] = []) => ({
  id,
  condominio_id: TENANT,
  propiedad_id: 'prop-1',
  concepto: `Cuota ${id}`,
  monto_original: new Decimal(original),
  monto_recargo: new Decimal(recargo),
  fecha_emision: new Date('2026-01-01'),
  fecha_vencimiento: new Date(venc),
  estado,
  pagos,
});

describe('GetAccountStatementUseCase', () => {
  const pagoRepo: any = { getAccountStatement: vi.fn() };
  const propertyRepo: any = { findAllByResident: vi.fn(), findByIdAndCondominio: vi.fn() };
  let useCase: GetAccountStatementUseCase;

  beforeEach(() => {
    vi.resetAllMocks();
    pagoRepo.getAccountStatement.mockResolvedValue({
      propiedad: { id: 'prop-1', identificador: 'Casa 1' },
      cuotas: [
        cuota('c1', 'PAGADA', '1000.10', '0', '2026-07-05', [pago('p1', '1000.10', 'APROBADO', '2026-07-01')]),
        cuota('c2', 'PARCIAL', '1000.10', '100.20', '2026-08-05', [
          pago('p2', '300.30', 'APROBADO', '2026-08-02'),
          pago('p3', '200.00', 'RECHAZADO', '2026-08-03'),
        ]),
        cuota('c3', 'VENCIDA', '1000.10', '100.20', '2026-09-05'),
        cuota('c4', 'PENDIENTE', '1000.10', '0', '2026-11-05'),
      ],
    });
    propertyRepo.findAllByResident.mockResolvedValue([{ id: 'prop-1' }]);
    propertyRepo.findByIdAndCondominio.mockResolvedValue({ id: 'prop-1' });
    useCase = new GetAccountStatementUseCase(pagoRepo, propertyRepo);
  });

  it('computes the exact owed balance across several fees and partial payments', async () => {
    const result = await useCase.execute(TENANT, { userId: 'admin', rol: 'ADMIN_CONDOMINIO' }, 'prop-1', now);

    // c2: 1100.30 - 300.30 = 800.00 ; c3: 1100.30 ; c4: 1000.10
    expect(result.cuotas.map((c) => c.saldo.toFixed(2))).toEqual(['0.00', '800.00', '1100.30', '1000.10']);
    expect(result.resumen.balance_adeudado.toFixed(2)).toBe('2900.40');
    expect(result.resumen.total_emitido.toFixed(2)).toBe('4200.80');
    expect(result.resumen.total_pagado.toFixed(2)).toBe('1300.40');
    expect(result.resumen).toMatchObject({ cuotas_emitidas: 4, cuotas_pagadas: 1, cuotas_vencidas: 2 });
    expect(result.pagos).toHaveLength(3);
    expect(result.pagos[0]!.id).toBe('p3'); // newest first
  });

  it('resolves the resident own property when no id is provided', async () => {
    await useCase.execute(TENANT, { userId: 'user-1', rol: 'RESIDENTE' }, undefined, now);
    expect(pagoRepo.getAccountStatement).toHaveBeenCalledWith('prop-1', TENANT);
  });

  it('forbids a resident from reading another property', async () => {
    await expect(
      useCase.execute(TENANT, { userId: 'user-1', rol: 'RESIDENTE' }, 'prop-999', now)
    ).rejects.toBeInstanceOf(UnauthorizedPaymentActionError);
    expect(pagoRepo.getAccountStatement).not.toHaveBeenCalled();
  });

  it('fails for a resident without properties and for unknown properties (admin)', async () => {
    propertyRepo.findAllByResident.mockResolvedValue([]);
    await expect(useCase.execute(TENANT, { userId: 'u', rol: 'RESIDENTE' })).rejects.toBeInstanceOf(NotFoundError);

    propertyRepo.findByIdAndCondominio.mockResolvedValue(null);
    await expect(
      useCase.execute(TENANT, { userId: 'a', rol: 'ADMIN_CONDOMINIO' }, 'nope')
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
