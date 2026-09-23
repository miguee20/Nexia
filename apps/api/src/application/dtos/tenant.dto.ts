import { z } from 'zod';

export const CreateTenantSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  direccion: z.string().min(1, 'La dirección es requerida'),
  logo_url: z.string().url().optional(),
});

export type CreateTenantDTO = z.infer<typeof CreateTenantSchema>;

export const UpdateTenantConfigSchema = z.object({
  modulos: z.object({
    garita_qr: z.boolean().optional(),
    finanzas: z.boolean().optional(),
    amenidades: z.boolean().optional(),
    marbetes: z.boolean().optional(),
  }).optional(),
  politicas: z.object({
    dia_corte_cuota: z.number().min(1).max(28).optional(),
    monto_cuota_base: z.number().min(0).optional(),
    recargo_mora_porcentaje: z.number().min(0).optional(),
    meses_para_moroso: z.number().min(1).optional(),
    bloquear_visitas_morosos: z.boolean().optional(),
    vigencia_pase_qr_horas: z.number().min(1).optional(),
    vigencia_alerta_delivery_horas: z.number().min(1).optional(),
    moneda: z.string().optional(),
    marbetes_incluidos_por_propiedad: z.number().min(0).optional(),
    costo_marbete_extra: z.number().min(0).optional(),
    periodo_marbete: z.enum(['MENSUAL', 'ANUAL']).optional(),
  }).optional(),
});

export type UpdateTenantConfigDTO = z.infer<typeof UpdateTenantConfigSchema>;
