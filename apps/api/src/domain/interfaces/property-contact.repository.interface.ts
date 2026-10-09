export interface PropertyContactEntity {
  identificador: string;
  propietario: { nombre_completo: string; telefono: string } | null;
  inquilino: { nombre_completo: string; telefono: string } | null;
}

export interface PropertySuggestionEntity {
  id: string;
  identificador: string;
}

export interface IPropertyContactRepository {
  findContactInfo(propiedad_id: string, condominio_id: string): Promise<PropertyContactEntity | null>;
  searchByIdentifier(query: string, condominio_id: string, limit: number): Promise<PropertySuggestionEntity[]>;
}
