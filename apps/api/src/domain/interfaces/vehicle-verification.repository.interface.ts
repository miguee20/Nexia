export interface VehicleVerificationEntity {
  id: string;
  placa: string;
  marca: string;
  color: string;
  propiedad: { identificador: string };
  marbete: { codigo: string; estado: string } | null;
}

export interface IVehicleVerificationRepository {
  findByPlacaOrMarbete(query: string, condominio_id: string): Promise<VehicleVerificationEntity | null>;
}
