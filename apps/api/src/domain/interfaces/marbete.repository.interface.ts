export interface MarbeteEntity {
  id: string;
  condominio_id: string;
  propiedad_id: string;
  vehiculo_id: string;
  codigo: string;
  fecha_emision: Date;
  fecha_vencimiento: Date;
  es_extra: boolean;
  estado: string;
}

export interface ExtendedMarbeteEntity extends MarbeteEntity {
  vehiculo?: any;
  propiedad?: any;
  _count?: any;
}

export interface CuotaData {
  condominio_id: string;
  propiedad_id: string;
  concepto: string;
  monto_original: number;
  fecha_emision: Date;
  fecha_vencimiento: Date;
  estado: string;
}

export interface IMarbeteRepository {
  create(data: Omit<MarbeteEntity, 'id'>): Promise<MarbeteEntity>;
  createWithExtraFee(marbeteData: Omit<MarbeteEntity, 'id'>, cuotaData: CuotaData): Promise<MarbeteEntity>;
  countActiveByProperty(propiedad_id: string, condominio_id: string): Promise<number>;
  findByCode(codigo: string, condominio_id: string): Promise<ExtendedMarbeteEntity | null>;
  findById(id: string, condominio_id: string): Promise<MarbeteEntity | null>;
  updateStatus(id: string, condominio_id: string, estado: string): Promise<MarbeteEntity>;
  findAllByProperty(propiedad_id: string, condominio_id: string): Promise<MarbeteEntity[]>;
}
