import { cn } from '@/lib/utils';
import type { EstadoCuota, EstadoPago, Semaforo } from '@/services/finance.service';

const BASE = 'inline-flex items-center whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-medium';

const TONES = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
  warning: 'bg-amber-50 text-amber-700 border-amber-200/60',
  danger: 'bg-rose-50 text-rose-700 border-rose-200/60',
  neutral: 'bg-zinc-100 text-zinc-700 border-zinc-200/60',
} as const;

type Tone = keyof typeof TONES;

function Pill({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return <span className={cn(BASE, TONES[tone], className)}>{children}</span>;
}

const CUOTA_LABELS: Record<EstadoCuota, { label: string; tone: Tone }> = {
  PENDIENTE: { label: 'Pendiente', tone: 'warning' },
  PARCIAL: { label: 'Pago parcial', tone: 'warning' },
  VENCIDA: { label: 'Vencida', tone: 'danger' },
  PAGADA: { label: 'Pagada', tone: 'success' },
};

const PAGO_LABELS: Record<EstadoPago, { label: string; tone: Tone }> = {
  PENDIENTE_REVISION: { label: 'En revisión', tone: 'warning' },
  APROBADO: { label: 'Aprobado', tone: 'success' },
  RECHAZADO: { label: 'Rechazado', tone: 'danger' },
};

const SEMAFORO_LABELS: Record<Semaforo, { label: string; tone: Tone }> = {
  AL_DIA: { label: 'Al día', tone: 'success' },
  ALERTA_1_MES: { label: '1 mes vencido', tone: 'warning' },
  MOROSO: { label: 'Moroso', tone: 'danger' },
};

export function CuotaStatusBadge({ estado }: { estado: EstadoCuota }) {
  const { label, tone } = CUOTA_LABELS[estado] ?? { label: estado, tone: 'neutral' as Tone };
  return <Pill tone={tone}>{label}</Pill>;
}

export function PagoStatusBadge({ estado }: { estado: EstadoPago }) {
  const { label, tone } = PAGO_LABELS[estado] ?? { label: estado, tone: 'neutral' as Tone };
  return <Pill tone={tone}>{label}</Pill>;
}

export function SemaforoBadge({ semaforo }: { semaforo: Semaforo }) {
  const { label, tone } = SEMAFORO_LABELS[semaforo] ?? { label: semaforo, tone: 'neutral' as Tone };
  return <Pill tone={tone}>{label}</Pill>;
}
