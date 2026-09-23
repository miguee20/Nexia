export interface PropertyEntity {
  id: string;
  condominio_id: string;
  identificador: string;
  tipo: string;
  estado: string;
  propietario_id: string | null;
  inquilino_id: string | null;
  area_m2: number | null;
}

export interface ExtendedPropertyEntity extends PropertyEntity {
  propietario?: any | null;
  inquilino?: any | null;
  _count?: {
    vehiculos: number;
  };
}

export interface PropertyFilters {
  tipo?: string;
  estado?: string;
  limit?: number;
  offset?: number;
}

export interface IPropertyRepository {
  create(data: {
    condominio_id: string;
    identificador: string;
    tipo: string;
    estado: string;
    area_m2?: number;
  }): Promise<PropertyEntity>;

  findByIdAndCondominio(id: string, condominio_id: string): Promise<ExtendedPropertyEntity | null>;
  
  findByIdentificadorAndCondominio(identificador: string, condominio_id: string): Promise<PropertyEntity | null>;

  findAllByCondominio(condominio_id: string, filters?: PropertyFilters): Promise<{ data: PropertyEntity[], total: number }>;

  update(id: string, condominio_id: string, data: Partial<Omit<PropertyEntity, 'id' | 'condominio_id' | 'propietario_id' | 'inquilino_id'>>): Promise<PropertyEntity>;

  assignResident(id: string, condominio_id: string, userId: string, tipoResidencia: 'PROPIETARIO' | 'INQUILINO'): Promise<PropertyEntity>;
}
