import { z } from 'zod';

export const IssueMarbeteSchema = z.object({
  vehiculo_id: z.string().uuid('Debe ser un UUID válido'),
  periodo: z.enum(['MENSUAL', 'ANUAL']),
});

export type IssueMarbeteDTO = z.infer<typeof IssueMarbeteSchema>;
