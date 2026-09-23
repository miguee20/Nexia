import { z } from 'zod';

export const CreatePropertySchema = z.object({
  identificador: z.string().min(1, 'Identificador es requerido'),
  tipo: z.enum(['CASA', 'APARTAMENTO', 'LOTE', 'LOCAL_COMERCIAL']),
  estado: z.enum(['OCUPADA', 'DESOCUPADA', 'EN_CONSTRUCCION']),
  area_m2: z.number().positive().optional(),
});

export type CreatePropertyDTO = z.infer<typeof CreatePropertySchema>;

export const UpdatePropertySchema = z.object({
  identificador: z.string().min(1).optional(),
  tipo: z.enum(['CASA', 'APARTAMENTO', 'LOTE', 'LOCAL_COMERCIAL']).optional(),
  estado: z.enum(['OCUPADA', 'DESOCUPADA', 'EN_CONSTRUCCION']).optional(),
  area_m2: z.number().positive().optional(),
});

export type UpdatePropertyDTO = z.infer<typeof UpdatePropertySchema>;

export const AssignResidentSchema = z.object({
  userId: z.string().uuid('Debe ser un UUID válido'),
  tipo_residencia: z.enum(['PROPIETARIO', 'INQUILINO']),
});

export type AssignResidentDTO = z.infer<typeof AssignResidentSchema>;
