export interface GateLogEntity {
  id: string;
  condominio_id: string;
  pase_id: string | null;
  alerta_delivery_id: string | null;
  guardia_id: string;
  nombre_visitante: string | null;
  placa_vehiculo: string | null;
  tipo_registro: string;
  entrada: Date | null;
  salida: Date | null;
  createdAt: Date;
}

export interface GateLogFilters {
  fecha_desde?: Date;
  fecha_hasta?: Date;
  tipo_evento?: string;
  propiedad_id?: string;
  limit?: number;
  offset?: number;
}

export interface GateLogWithRelations extends GateLogEntity {
  guardia: { nombre_completo: string };
  pase?: { propiedad: { identificador: string } } | null;
  alerta_delivery?: { propiedad: { identificador: string } } | null;
}

export interface IGateLogRepository {
  create(data: Omit<GateLogEntity, 'id' | 'createdAt'>): Promise<GateLogEntity>;
  updateExit(id: string, condominio_id: string, salida: Date, tipo_registro: string): Promise<GateLogEntity>;
  findPaginated(condominio_id: string, filters: GateLogFilters): Promise<{ data: GateLogWithRelations[]; total: number }>;
  findAllStream(condominio_id: string, filters: Omit<GateLogFilters, 'limit' | 'offset'>): Promise<GateLogWithRelations[]>;
}
