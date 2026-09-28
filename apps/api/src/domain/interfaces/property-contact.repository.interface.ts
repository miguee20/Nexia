export interface PropertyContactEntity {
  identificador: string;
  propietario: { nombre_completo: string; telefono: string } | null;
  inquilino: { nombre_completo: string; telefono: string } | null;
}

export interface IPropertyContactRepository {
  findContactInfo(propiedad_id: string, condominio_id: string): Promise<PropertyContactEntity | null>;
}
