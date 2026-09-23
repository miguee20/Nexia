import { z } from 'zod';

export const CreateVehicleSchema = z.object({
  placa: z.string().min(1, 'La placa es requerida').transform(val => val.toUpperCase()),
  marca: z.string().min(1, 'La marca es requerida'),
  color: z.string().min(1, 'El color es requerido'),
  modelo: z.string().optional(),
  tipo: z.enum(['SEDAN', 'PICKUP', 'MOTO']),
});

export type CreateVehicleDTO = z.infer<typeof CreateVehicleSchema>;
