export interface VisitPassEntity {
  id: string;
  condominio_id: string;
  residente_id: string;
  propiedad_id: string;
  nombre_visitante: string;
  placa_vehiculo: string | null;
  motivo: string;
  qr_token: string;
  fecha_creacion: Date;
  fecha_expiracion: Date;
  estado: string;
}

export interface VisitPassWithRelations extends VisitPassEntity {
  propiedad: {
    identificador: string;
  };
  residente: {
    nombre_completo: string;
  };
}

export interface IVisitPassRepository {
  create(data: Omit<VisitPassEntity, 'id' | 'qr_token' | 'fecha_creacion' | 'estado'> & { qr_token: string }): Promise<VisitPassEntity>;
  findByToken(token: string, condominio_id: string): Promise<VisitPassWithRelations | null>;
  findActiveByResident(residente_id: string, condominio_id: string): Promise<VisitPassWithRelations[]>;
  updateState(id: string, condominio_id: string, estado: 'UTILIZADO' | 'EXPIRADO' | 'CANCELADO'): Promise<VisitPassEntity>;
}
