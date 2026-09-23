export interface TenantEntity {
  id: string;
  nombre: string;
  direccion: string;
  logo_url: string | null;
  configuracion: any;
  activo: boolean;
}

export interface ITenantRepository {
  create(data: { nombre: string; direccion: string; configuracion: any }): Promise<TenantEntity>;
  findAll(): Promise<TenantEntity[]>;
  findById(id: string): Promise<TenantEntity | null>;
  updateConfig(id: string, configuracion: any): Promise<TenantEntity>;
}
