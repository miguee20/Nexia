/**
 * Display helpers for monetary values and dates.
 * Monetary amounts arrive from the API as decimal strings; they are formatted by
 * string manipulation only (never through JS floats) to avoid precision loss.
 */

export const CURRENCY_SYMBOL = 'Q';

export function formatMoney(value: string | number | null | undefined, symbol: string = CURRENCY_SYMBOL): string {
  if (value === null || value === undefined || value === '') return `${symbol} 0.00`;
  const raw = String(value).trim();
  const negative = raw.startsWith('-');
  const unsigned = negative ? raw.slice(1) : raw;
  const [intPartRaw = '0', fracRaw = ''] = unsigned.split('.');
  const intPart = (intPartRaw.replace(/\D/g, '') || '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const frac = (fracRaw.replace(/\D/g, '') + '00').slice(0, 2);
  return `${negative ? '-' : ''}${symbol} ${intPart}.${frac}`;
}

/** Formats an ISO date/datetime (YYYY-MM-DD...) as DD/MM/YYYY without timezone shifts. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

/** Returns today's date as YYYY-MM-DD in local time (for <input type="date">). */
export function todayInputValue(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: { message?: string; error?: string } } })?.response?.data;
  return data?.message || data?.error || fallback;
}
