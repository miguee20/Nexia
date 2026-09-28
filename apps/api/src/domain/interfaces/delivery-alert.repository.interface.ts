export interface DeliveryAlertEntity {
  id: string;
  condominio_id: string;
  residente_id: string;
  propiedad_id: string;
  descripcion: string;
  nombre_repartidor: string | null;
  fecha_creacion: Date;
  fecha_expiracion: Date;
  estado: string;
}

export interface DeliveryAlertWithRelations extends DeliveryAlertEntity {
  propiedad: {
    identificador: string;
  };
  residente: {
    nombre_completo: string;
  };
}

export interface IDeliveryAlertRepository {
  create(data: Omit<DeliveryAlertEntity, 'id' | 'fecha_creacion' | 'estado'>): Promise<DeliveryAlertEntity>;
  findActiveByCondominio(condominio_id: string): Promise<DeliveryAlertWithRelations[]>;
  findActiveByResident(residente_id: string, condominio_id: string): Promise<DeliveryAlertWithRelations[]>;
  updateState(id: string, condominio_id: string, estado: 'COMPLETADA' | 'EXPIRADA' | 'CANCELADA'): Promise<DeliveryAlertEntity>;
}
