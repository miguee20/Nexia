export interface CuotaEntity {
  id: string;
  condominio_id: string;
  propiedad_id: string;
  concepto: string;
  monto_original: number;
  monto_recargo: number;
  fecha_emision: Date;
  fecha_vencimiento: Date;
  estado: string;
}

export interface ICuotaRepository {
  hasOverdueFees(propiedad_id: string, condominio_id: string, dateLimit: Date): Promise<boolean>;
}
