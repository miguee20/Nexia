import { Decimal } from '../value-objects/money';
import { CuotaEntity } from './cuota.repository.interface';

export type EstadoPago = 'PENDIENTE_REVISION' | 'APROBADO' | 'RECHAZADO';

export interface PagoEntity {
  id: string;
  cuota_id: string;
  residente_id: string;
  monto: Decimal;
  referencia_bancaria: string | null;
  comprobante_url: string | null;
  estado: EstadoPago;
  motivo_rechazo: string | null;
  fecha_pago: Date;
  fecha_revision: Date | null;
  revisado_por_id: string | null;
}

export interface PendingPaymentView extends PagoEntity {
  cuota: Pick<CuotaEntity, 'id' | 'concepto' | 'monto_original' | 'monto_recargo' | 'propiedad_id'>;
  residente: { id: string; nombre_completo: string; email: string };
  propiedad_identificador: string;
}

export interface AccountStatementCuota extends CuotaEntity {
  pagos: PagoEntity[];
}

export interface AccountStatementResult {
  propiedad: { id: string; identificador: string };
  cuotas: AccountStatementCuota[];
}

export interface MonthlyReportResult {
  total_emitido: Decimal;
  total_recaudado: Decimal;
  monto_mora: Decimal;
  pagos_conciliados: Array<{
    pago_id: string;
    cuota_id: string;
    concepto: string;
    propiedad_identificador: string;
    monto: Decimal;
    fecha_revision: Date | null;
  }>;
}

export interface ReceiptContext {
  pago: PagoEntity;
  cuota: Pick<CuotaEntity, 'id' | 'concepto' | 'monto_original' | 'monto_recargo'>;
  residente: { id: string; nombre_completo: string };
  propiedad_identificador: string;
  condominio: { nombre: string; configuracion: any };
}

export interface IPagoRepository {
  /** Creates a payment; verifies that the fee belongs to `condominio_id`. */
  create(pago: Partial<PagoEntity>, condominio_id: string): Promise<PagoEntity>;
  findById(id: string, condominio_id: string): Promise<PagoEntity | null>;
  listPending(condominio_id: string): Promise<PendingPaymentView[]>;
  /** Sum of APROBADO payments for a fee (tenant-scoped). */
  sumApprovedByCuota(cuota_id: string, condominio_id: string): Promise<Decimal>;
  /** Atomic (`$transaction`): marks payment APROBADO and updates the fee state. */
  approve(
    pagoId: string,
    adminId: string,
    cuotaId: string,
    nuevoEstadoCuota: string,
    condominio_id: string
  ): Promise<PagoEntity>;
  reject(pagoId: string, adminId: string, motivo: string, condominio_id: string): Promise<PagoEntity>;
  getAccountStatement(propiedadId: string, condominio_id: string): Promise<AccountStatementResult>;
  getMonthlyReport(condominio_id: string, mes: number, anio: number): Promise<MonthlyReportResult>;
  getReceiptContext(pagoId: string, condominio_id: string): Promise<ReceiptContext | null>;
}
