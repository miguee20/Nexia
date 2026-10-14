import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  hint,
  indicator,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  /** Tailwind background class for a small inline status dot (e.g. `bg-emerald-500`). */
  indicator?: string;
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl border border-zinc-200/80 bg-white p-4 shadow-xs sm:p-5', className)}>
      <p className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
        {indicator && <span aria-hidden="true" className={cn('h-2 w-2 rounded-full', indicator)} />}
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}
