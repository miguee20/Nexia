import { Decimal } from '../value-objects/money';

export interface CuotaEntity {
  id: string;
  condominio_id: string;
  propiedad_id: string;
  concepto: string;
  monto_original: Decimal;
  monto_recargo: Decimal;
  fecha_emision: Date;
  fecha_vencimiento: Date;
  estado: string;
}

export interface FeeFilters {
  propiedad_id?: string;
  estado?: string;
  fecha_desde?: Date;
  fecha_hasta?: Date;
}

export interface FeePagination {
  limit?: number;
  offset?: number;
}

export interface DelinquencyRow {
  propiedad_id: string;
  identificador: string;
  cuotas_vencidas: number;
  cuotas_pendientes: number;
  balance_adeudado: Decimal;
}

export interface ICuotaRepository {
  hasOverdueFees(propiedad_id: string, condominio_id: string, dateLimit: Date): Promise<boolean>;
  create(cuota: Partial<CuotaEntity>): Promise<CuotaEntity>;
  createBatch(cuotas: Partial<CuotaEntity>[]): Promise<{ count: number }>;
  findById(id: string, condominio_id: string): Promise<CuotaEntity | null>;
  findOverduePending(condominio_id: string, dateLimit: Date): Promise<CuotaEntity[]>;
  updateRecargo(id: string, condominio_id: string, monto_recargo: Decimal, estado?: string): Promise<CuotaEntity>;
  getDelinquencySummary(condominio_id: string, mesesParaMoroso: number, now: Date): Promise<DelinquencyRow[]>;
  listFees(condominio_id: string, filters: FeeFilters, pagination?: FeePagination): Promise<CuotaEntity[]>;
  countFees(condominio_id: string, filters: FeeFilters): Promise<number>;
  /** IDs of properties that already have a fee with this concept issued within [desde, hasta). */
  findPropertyIdsWithConcept(condominio_id: string, concepto: string, desde: Date, hasta: Date): Promise<string[]>;
}
