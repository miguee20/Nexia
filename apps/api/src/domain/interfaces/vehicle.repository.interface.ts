export interface VehicleEntity {
  id: string;
  condominio_id: string;
  propiedad_id: string;
  placa: string;
  marca: string;
  color: string;
  modelo: string | null;
  tipo: string;
}

export interface IVehicleRepository {
  create(data: Omit<VehicleEntity, 'id'>): Promise<VehicleEntity>;
  findById(id: string, condominio_id: string): Promise<VehicleEntity | null>;
  findByPlaca(placa: string, condominio_id: string): Promise<VehicleEntity | null>;
  findAllByProperty(propiedad_id: string, condominio_id: string): Promise<VehicleEntity[]>;
}
