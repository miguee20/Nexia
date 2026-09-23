export interface UserEntity {
  id: string;
  condominio_id: string;
  email: string;
  password_hash: string;
  nombre_completo: string;
  rol: 'SUPERADMIN' | 'ADMIN_CONDOMINIO' | 'RESIDENTE' | 'GUARDIA';
  activo: boolean;
  condominio?: {
    activo: boolean;
  };
}

export interface IUserRepository {
  findByEmail(email: string): Promise<UserEntity | null>;
  findById(id: string): Promise<UserEntity | null>;
}
