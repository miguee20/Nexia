import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  password: z.string().min(1, { message: 'La contraseña es requerida' }),
});

export type LoginDTO = z.infer<typeof LoginSchema>;

export interface LoginResponseDTO {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    nombre_completo: string;
    rol: string;
    condominio_id: string;
  };
}

export interface RefreshTokenResponseDTO {
  accessToken: string;
}
