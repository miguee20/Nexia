import { z } from 'zod';

const isoDate = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Debe ser una fecha ISO válida' });

/** Monetary amount: accepted as string (preferred) or number, normalized to a decimal string. */
const moneyAmount = z
  .union([z.string(), z.number()])
  .transform((v) => String(v).trim())
  .refine((v) => /^\d+(\.\d{1,2})?$/.test(v) && Number(v) > 0, {
    message: 'El monto debe ser positivo con máximo 2 decimales',
  });

export const EmitIndividualFeeSchema = z.object({
  propiedad_id: z.string().uuid('Debe ser un UUID válido'),
  concepto: z.string().min(3),
  monto: moneyAmount,
  fecha_vencimiento: isoDate,
});

export const EmitBatchFeesSchema = z.object({
  mes: z.number().int().min(1).max(12).optional(),
  anio: z.number().int().min(2000).max(2100).optional(),
  concepto: z.string().min(3),
  monto_override: moneyAmount.optional(),
  fecha_vencimiento: isoDate.optional(),
});

export const ApplyLateFeesSchema = z.object({
  fecha_corte: isoDate.optional(),
});

export const ListFeesQuerySchema = z.object({
  propiedad_id: z.string().uuid().optional(),
  estado: z.enum(['PENDIENTE', 'PAGADA', 'VENCIDA', 'PARCIAL']).optional(),
  fecha_desde: isoDate.optional(),
  fecha_hasta: isoDate.optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type EmitIndividualFeeDTO = z.infer<typeof EmitIndividualFeeSchema>;
export type EmitBatchFeesDTO = z.infer<typeof EmitBatchFeesSchema>;
export type ApplyLateFeesDTO = z.infer<typeof ApplyLateFeesSchema>;
export type ListFeesQueryDTO = z.infer<typeof ListFeesQuerySchema>;
