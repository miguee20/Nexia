import { z } from 'zod';

export const GenerateVisitPassSchema = z.object({
  nombre_visitante: z.string().min(1, 'El nombre del visitante es requerido'),
  motivo: z.enum(['VISITA_PERSONAL', 'SERVICIO_TECNICO', 'EVENTO']),
  fecha_llegada: z.string().datetime().optional(),
  vehiculo_placa: z.string().optional()
});
export type GenerateVisitPassDto = z.infer<typeof GenerateVisitPassSchema>;

export const CreateDeliveryAlertSchema = z.object({
  descripcion: z.string().min(1, 'La descripción es requerida (ej. Empresa o tipo de paquete)'),
  nombre_repartidor: z.string().optional()
});
export type CreateDeliveryAlertDto = z.infer<typeof CreateDeliveryAlertSchema>;

export const ValidateQRSchema = z.object({
  qr_token: z.string().min(1, 'El token QR es requerido')
});
export type ValidateQRDto = z.infer<typeof ValidateQRSchema>;
