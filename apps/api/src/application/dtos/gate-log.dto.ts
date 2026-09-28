import { z } from 'zod';

export const RegisterEntrySchema = z.object({
  pase_id: z.string().uuid('ID de pase inválido'),
  placa_vehiculo: z.string().optional(),
});
export type RegisterEntryDto = z.infer<typeof RegisterEntrySchema>;

export const RegisterExitSchema = z.object({
  registro_id: z.string().uuid('ID de registro inválido'),
});
export type RegisterExitDto = z.infer<typeof RegisterExitSchema>;

export const ManualEntrySchema = z.object({
  nombre_visitante: z.string().min(1, 'Nombre del visitante requerido'),
  documento_identidad: z.string().optional(),
  motivo: z.string().min(1, 'Motivo requerido'),
  propiedad_id: z.string().uuid('Propiedad destino requerida'),
  placa_vehiculo: z.string().optional(),
  observaciones: z.string().optional(),
});
export type ManualEntryDto = z.infer<typeof ManualEntrySchema>;

export const RegisterDeliveryEntrySchema = z.object({
  alerta_id: z.string().uuid('ID de alerta inválido'),
  nombre_repartidor: z.string().optional(),
  observaciones: z.string().optional(),
});
export type RegisterDeliveryEntryDto = z.infer<typeof RegisterDeliveryEntrySchema>;

export const RegisterCallVerificationSchema = z.object({
  propiedad_id: z.string().uuid('Propiedad destino requerida'),
  nombre_visitante: z.string().min(1, 'Nombre del visitante requerido'),
  telefono_contactado: z.string().min(1, 'Teléfono contactado requerido'),
  autorizo_ingreso: z.boolean(),
  observaciones: z.string().optional(),
});
export type RegisterCallVerificationDto = z.infer<typeof RegisterCallVerificationSchema>;

export const GateLogFilterSchema = z.object({
  fecha_desde: z.string().datetime().optional(),
  fecha_hasta: z.string().datetime().optional(),
  tipo_evento: z.string().optional(),
  propiedad_id: z.string().uuid().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});
export type GateLogFilterDto = z.infer<typeof GateLogFilterSchema>;
