import { api } from '@/lib/api';

/** Monetary values are decimal strings coming from the API (never floats). */
export type Money = string;

export type EstadoCuota = 'PENDIENTE' | 'PAGADA' | 'VENCIDA' | 'PARCIAL';
export type EstadoPago = 'PENDIENTE_REVISION' | 'APROBADO' | 'RECHAZADO';
export type Semaforo = 'AL_DIA' | 'ALERTA_1_MES' | 'MOROSO';

export interface Cuota {
  id: string;
  condominio_id: string;
  propiedad_id: string;
  concepto: string;
  monto_original: Money;
  monto_recargo: Money;
  fecha_emision: string;
  fecha_vencimiento: string;
  estado: EstadoCuota;
}

export interface ListFeesParams {
  propiedad_id?: string;
  estado?: EstadoCuota;
  fecha_desde?: string;
  fecha_hasta?: string;
  limit?: number;
  offset?: number;
}

export interface ListFeesResponse {
  data: Cuota[];
  total: number;
  limit: number;
  offset: number;
}

export interface EmitIndividualFeeInput {
  propiedad_id: string;
  concepto: string;
  monto: string;
  fecha_vencimiento: string;
}

export interface EmitBatchFeesInput {
  mes?: number;
  anio?: number;
  concepto: string;
  monto_override?: string;
  fecha_vencimiento?: string;
}

export interface EmitBatchFeesResult {
  created: number;
  skipped: number;
  mes: number;
  anio: number;
}

export interface TrafficLightItem {
  propiedad_id: string;
  identificador: string;
  semaforo: Semaforo;
  cuotas_vencidas: number;
  cuotas_pendientes: number;
  balance_adeudado: Money;
}

export interface Pago {
  id: string;
  cuota_id: string;
  residente_id: string;
  monto: Money;
  referencia_bancaria: string | null;
  comprobante_url: string | null;
  estado: EstadoPago;
  motivo_rechazo: string | null;
  fecha_pago: string;
  fecha_revision: string | null;
  revisado_por_id: string | null;
}

export interface PendingPayment extends Pago {
  cuota: {
    id: string;
    concepto: string;
    monto_original: Money;
    monto_recargo: Money;
    propiedad_id: string;
  };
  residente: { id: string; nombre_completo: string; email: string };
  propiedad_identificador: string;
}

export interface AccountStatementCuota extends Omit<Cuota, 'estado'> {
  estado: EstadoCuota;
  total: Money;
  pagado: Money;
  saldo: Money;
  vencida: boolean;
}

export interface AccountStatement {
  propiedad: { id: string; identificador: string };
  resumen: {
    cuotas_emitidas: number;
    cuotas_vencidas: number;
    cuotas_pagadas: number;
    total_emitido: Money;
    total_pagado: Money;
    balance_adeudado: Money;
  };
  cuotas: AccountStatementCuota[];
  pagos: Pago[];
}

export interface SubmitPaymentInput {
  cuota_id: string;
  monto: string;
  referencia_bancaria?: string;
  comprobante_url: string;
  fecha_pago: string;
}

export interface MonthlyReport {
  mes: number;
  anio: number;
  total_emitido: Money;
  total_recaudado: Money;
  monto_mora: Money;
  tasa_recaudacion: string;
  pagos_conciliados: Array<{
    pago_id: string;
    cuota_id: string;
    concepto: string;
    propiedad_identificador: string;
    monto: Money;
    fecha_revision: string | null;
  }>;
}

export const financeService = {
  // ---------- Admin: fees ----------
  listFees: async (params: ListFeesParams = {}): Promise<ListFeesResponse> => {
    const res = await api.get('/finances/fees', { params });
    return res.data;
  },

  emitIndividualFee: async (data: EmitIndividualFeeInput): Promise<Cuota> => {
    const res = await api.post('/finances/fees/individual', data);
    return res.data;
  },

  emitBatchFees: async (data: EmitBatchFeesInput): Promise<EmitBatchFeesResult> => {
    const res = await api.post('/finances/fees/batch', data);
    return res.data;
  },

  applyLateFees: async (): Promise<{ updated: number; fecha_corte: string }> => {
    const res = await api.post('/finances/fees/apply-late-fees', {});
    return res.data;
  },

  getDelinquencyTrafficLight: async (): Promise<TrafficLightItem[]> => {
    const res = await api.get('/finances/fees/traffic-light');
    return res.data;
  },

  // ---------- Admin: payments ----------
  getPendingPayments: async (): Promise<PendingPayment[]> => {
    const res = await api.get('/finances/payments/pending');
    return res.data;
  },

  approvePayment: async (pagoId: string): Promise<Pago> => {
    const res = await api.post(`/finances/payments/${pagoId}/approve`, {});
    return res.data;
  },

  rejectPayment: async (pagoId: string, motivo: string): Promise<Pago> => {
    const res = await api.post(`/finances/payments/${pagoId}/reject`, { motivo_rechazo: motivo });
    return res.data;
  },

  // ---------- Resident / shared ----------
  submitPayment: async (data: SubmitPaymentInput): Promise<Pago> => {
    const res = await api.post('/finances/payments', data);
    return res.data;
  },

  getAccountStatement: async (propiedadId?: string): Promise<AccountStatement> => {
    const res = await api.get(propiedadId ? `/finances/account-statement/${propiedadId}` : '/finances/account-statement');
    return res.data;
  },

  getMonthlyReport: async (mes: number, anio: number): Promise<MonthlyReport> => {
    const res = await api.get('/finances/reports/monthly', { params: { mes, anio } });
    return res.data;
  },

  /** Downloads the receipt PDF as a blob and triggers a browser download. */
  downloadReceiptPdf: async (pagoId: string): Promise<void> => {
    const res = await api.get(`/finances/payments/${pagoId}/receipt`, { responseType: 'blob' });
    const disposition: string | undefined = res.headers['content-disposition'];
    const match = disposition ? /filename="?([^";]+)"?/.exec(disposition) : null;
    const filename = match?.[1] ?? `recibo-${pagoId}.pdf`;

    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
