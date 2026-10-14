import { Decimal } from '../value-objects/money';

export interface ReceiptData {
  folio: string;
  fecha_emision: Date;
  condominio_nombre: string;
  residente_nombre: string;
  propiedad_identificador: string;
  concepto: string;
  monto_pagado: Decimal;
  referencia_bancaria: string | null;
  fecha_pago: Date;
  moneda: string;
  simbolo_moneda: string;
}

export interface IReceiptGeneratorService {
  generateReceiptBuffer(data: ReceiptData): Promise<Buffer>;
}
