import PDFDocument from 'pdfkit';
import {
  IReceiptGeneratorService,
  ReceiptData,
} from '../../domain/interfaces/receipt-generator.interface';

const formatDate = (d: Date): string => d.toISOString().slice(0, 10);

export class ReceiptGeneratorService implements IReceiptGeneratorService {
  generateReceiptBuffer(data: ReceiptData): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A5', margin: 40, info: { Title: `Recibo ${data.folio}` } });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const left = doc.page.margins.left;
      const width = doc.page.width - left - doc.page.margins.right;

      // Header
      doc.font('Helvetica-Bold').fontSize(16).fillColor('#111827').text(data.condominio_nombre, { align: 'left' });
      doc.font('Helvetica').fontSize(9).fillColor('#6b7280').text('Recibo de pago');
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#111827').text(`Folio: ${data.folio}`);
      doc.font('Helvetica').fontSize(9).fillColor('#6b7280').text(`Fecha de emisión: ${formatDate(data.fecha_emision)}`);

      doc.moveDown(0.8);
      doc.moveTo(left, doc.y).lineTo(left + width, doc.y).strokeColor('#e5e7eb').stroke();
      doc.moveDown(0.8);

      // Detail rows
      const row = (label: string, value: string) => {
        const y = doc.y;
        doc.font('Helvetica').fontSize(9).fillColor('#6b7280').text(label, left, y, { width: 110 });
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827').text(value, left + 120, y, { width: width - 120 });
        doc.moveDown(0.6);
      };

      row('Recibí de', data.residente_nombre);
      row('Propiedad', data.propiedad_identificador);
      row('Concepto', data.concepto);
      row('Fecha de pago', formatDate(data.fecha_pago));
      row('Referencia bancaria', data.referencia_bancaria ?? 'N/A');

      doc.moveDown(0.4);
      doc.moveTo(left, doc.y).lineTo(left + width, doc.y).strokeColor('#e5e7eb').stroke();
      doc.moveDown(0.8);

      // Total (Decimal -> string, never a JS float)
      doc.font('Helvetica').fontSize(9).fillColor('#6b7280').text('Total pagado', left, doc.y);
      doc
        .font('Helvetica-Bold')
        .fontSize(20)
        .fillColor('#111827')
        .text(`${data.simbolo_moneda} ${data.monto_pagado.toFixed(2)} ${data.moneda}`);

      doc.moveDown(1.5);
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#047857').text('PAGO CONCILIADO', { align: 'right' });
      doc.font('Helvetica').fontSize(8).fillColor('#6b7280').text(
        'Documento generado electrónicamente por Nexia. No requiere firma.',
        left,
        doc.page.height - doc.page.margins.bottom - 10,
        { width, align: 'center' }
      );

      doc.end();
    });
  }
}
