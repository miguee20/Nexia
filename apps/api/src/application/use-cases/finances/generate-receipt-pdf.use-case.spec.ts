import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenerateReceiptPdfUseCase } from './generate-receipt-pdf.use-case';
import { ReceiptGeneratorService } from '../../../infrastructure/pdf/receipt-generator.service';
import { Decimal } from '../../../domain/value-objects/money';
import {
  PaymentNotApprovedError,
  PaymentNotFoundError,
  UnauthorizedPaymentActionError,
} from '../../../domain/errors/payment.errors';

const TENANT = 'tenant-a';

const ctx = (estado: string) => ({
  pago: {
    id: 'aaaaaaaa-1111-4111-8111-111111111111',
    residente_id: 'user-1',
    monto: new Decimal('1100.50'),
    estado,
    referencia_bancaria: 'BAN-1',
    fecha_pago: new Date('2026-10-10'),
    fecha_revision: new Date('2026-10-12'),
  },
  cuota: { id: 'c1', concepto: 'Mantenimiento octubre', monto_original: new Decimal('1000'), monto_recargo: new Decimal('100.50') },
  residente: { id: 'user-1', nombre_completo: 'Ana Pérez' },
  propiedad_identificador: 'Casa 12',
  condominio: { nombre: 'Residenciales Nexia', configuracion: { moneda: 'GTQ' } },
});

describe('GenerateReceiptPdfUseCase', () => {
  const pagoRepo: any = { getReceiptContext: vi.fn() };
  let useCase: GenerateReceiptPdfUseCase;

  beforeEach(() => {
    vi.resetAllMocks();
    useCase = new GenerateReceiptPdfUseCase(pagoRepo, new ReceiptGeneratorService());
  });

  it('generates a valid PDF buffer for an approved payment', async () => {
    pagoRepo.getReceiptContext.mockResolvedValue(ctx('APROBADO'));

    const { buffer, folio } = await useCase.execute(TENANT, { userId: 'user-1', rol: 'RESIDENTE' }, 'pago-1');

    expect(pagoRepo.getReceiptContext).toHaveBeenCalledWith('pago-1', TENANT);
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-');
    expect(buffer.length).toBeGreaterThan(500);
    expect(folio).toBe('REC-2026-AAAAAAAA');
  });

  it('passes exact decimal amount and currency to the generator', async () => {
    pagoRepo.getReceiptContext.mockResolvedValue(ctx('APROBADO'));
    const generator = { generateReceiptBuffer: vi.fn().mockResolvedValue(Buffer.from('%PDF-')) };
    await new GenerateReceiptPdfUseCase(pagoRepo, generator).execute(TENANT, { userId: 'a', rol: 'ADMIN_CONDOMINIO' }, 'pago-1');

    const data = generator.generateReceiptBuffer.mock.calls[0]![0];
    expect(data.monto_pagado.toFixed(2)).toBe('1100.50');
    expect(data.simbolo_moneda).toBe('Q');
    expect(data.propiedad_identificador).toBe('Casa 12');
  });

  it.each(['PENDIENTE_REVISION', 'RECHAZADO'])('fails for a %s payment', async (estado) => {
    pagoRepo.getReceiptContext.mockResolvedValue(ctx(estado));
    await expect(
      useCase.execute(TENANT, { userId: 'user-1', rol: 'RESIDENTE' }, 'pago-1')
    ).rejects.toBeInstanceOf(PaymentNotApprovedError);
  });

  it('fails when the payment does not exist in the tenant', async () => {
    pagoRepo.getReceiptContext.mockResolvedValue(null);
    await expect(useCase.execute(TENANT, { userId: 'a', rol: 'ADMIN_CONDOMINIO' }, 'x')).rejects.toBeInstanceOf(
      PaymentNotFoundError
    );
  });

  it('forbids a resident from downloading another resident receipt', async () => {
    pagoRepo.getReceiptContext.mockResolvedValue(ctx('APROBADO'));
    await expect(
      useCase.execute(TENANT, { userId: 'intruder', rol: 'RESIDENTE' }, 'pago-1')
    ).rejects.toBeInstanceOf(UnauthorizedPaymentActionError);
  });
});
