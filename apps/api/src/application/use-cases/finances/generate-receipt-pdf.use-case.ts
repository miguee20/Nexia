import { IPagoRepository } from '../../../domain/interfaces/pago.repository.interface';
import { IReceiptGeneratorService } from '../../../domain/interfaces/receipt-generator.interface';
import {
  PaymentNotApprovedError,
  PaymentNotFoundError,
  UnauthorizedPaymentActionError,
} from '../../../domain/errors/payment.errors';
import { Actor } from './finance.helpers';

const CURRENCY_SYMBOLS: Record<string, string> = { GTQ: 'Q', USD: '$', MXN: '$', EUR: '€' };

export class GenerateReceiptPdfUseCase {
  constructor(
    private readonly pagoRepository: IPagoRepository,
    private readonly receiptGenerator: IReceiptGeneratorService
  ) {}

  async execute(
    condominio_id: string,
    actor: Actor,
    pagoId: string,
    now: Date = new Date()
  ): Promise<{ buffer: Buffer; folio: string }> {
    const ctx = await this.pagoRepository.getReceiptContext(pagoId, condominio_id);
    if (!ctx) throw new PaymentNotFoundError();

    if (actor.rol === 'RESIDENTE' && ctx.pago.residente_id !== actor.userId) {
      throw new UnauthorizedPaymentActionError('No puedes descargar el recibo de otro residente');
    }
    if (ctx.pago.estado !== 'APROBADO') throw new PaymentNotApprovedError();

    const fechaRevision = ctx.pago.fecha_revision ?? now;
    const folio = `REC-${fechaRevision.getUTCFullYear()}-${ctx.pago.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
    const moneda: string = ctx.condominio.configuracion?.moneda || 'GTQ';

    const buffer = await this.receiptGenerator.generateReceiptBuffer({
      folio,
      fecha_emision: fechaRevision,
      condominio_nombre: ctx.condominio.nombre,
      residente_nombre: ctx.residente.nombre_completo,
      propiedad_identificador: ctx.propiedad_identificador,
      concepto: ctx.cuota.concepto,
      monto_pagado: ctx.pago.monto,
      referencia_bancaria: ctx.pago.referencia_bancaria,
      fecha_pago: ctx.pago.fecha_pago,
      moneda,
      simbolo_moneda: CURRENCY_SYMBOLS[moneda] ?? moneda,
    });

    return { buffer, folio };
  }
}
