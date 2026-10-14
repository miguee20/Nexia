import { z } from 'zod';

const isoDate = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Debe ser una fecha ISO válida' });

const moneyAmount = z
  .union([z.string(), z.number()])
  .transform((v) => String(v).trim())
  .refine((v) => /^\d+(\.\d{1,2})?$/.test(v) && Number(v) > 0, {
    message: 'El monto debe ser positivo con máximo 2 decimales',
  });

const comprobante = z
  .string()
  .refine((v) => /^data:(image\/(png|jpe?g|webp)|application\/pdf);base64,[A-Za-z0-9+/=]+$/.test(v) || /^https?:\/\/\S+$/.test(v), {
    message: 'Debe ser una URL http(s) o un data URI de imagen/PDF en base64',
  });

export const SubmitPaymentSchema = z.object({
  cuota_id: z.string().uuid('Debe ser un UUID válido'),
  monto: moneyAmount,
  referencia_bancaria: z.string().min(3).optional(),
  comprobante_url: comprobante,
  fecha_pago: isoDate,
});

export const RejectPaymentSchema = z.object({
  motivo_rechazo: z.string().min(5),
});

export const MonthlyReportQuerySchema = z.object({
  mes: z.coerce.number().int().min(1).max(12),
  anio: z.coerce.number().int().min(1000).max(9999),
});

export type SubmitPaymentDTO = z.infer<typeof SubmitPaymentSchema>;
export type RejectPaymentDTO = z.infer<typeof RejectPaymentSchema>;
export type MonthlyReportQueryDTO = z.infer<typeof MonthlyReportQuerySchema>;
