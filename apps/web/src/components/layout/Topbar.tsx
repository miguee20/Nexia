'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../stores/useAuth';
import { Building2, ChevronRight, Menu } from 'lucide-react';

/**
 * Maps route segments to human-readable breadcrumb labels.
 */
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Panel',
  propiedades: 'Propiedades',
  residentes: 'Residentes',
  finanzas: 'Finanzas',
  marbetes: 'Marbetes',
  amenidades: 'Amenidades',
  configuracion: 'Configuración',
  garita: 'Garita',
  'mi-cuenta': 'Mi Cuenta',
  cuotas: 'Cuotas',
  visitas: 'Visitas',
  deliveries: 'Deliveries',
  reservas: 'Reservas',
  sa: 'SuperAdmin',
  condominios: 'Condominios',
  metricas: 'Métricas',
};

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: 'Super Admin',
  ADMIN_CONDOMINIO: 'Administrador',
  GUARDIA: 'Guardia',
  RESIDENTE: 'Residente',
};

export function Topbar({ onMenuClick }: { onMenuClick?: () => void } = {}) {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  // Build breadcrumb from path segments, filtering out "(dashboard)" route groups and UUIDs
  const segments = pathname
    .split('/')
    .filter(Boolean)
    .filter((s) => !s.startsWith('(') && !s.match(/^[0-9a-f]{8}-/));

  const breadcrumbs = segments.map(
    (seg) => SEGMENT_LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1)
  );

  return (
    <header className="h-14 border-b border-zinc-200/70 bg-white px-4 md:px-6 gap-3 flex items-center justify-between shrink-0 sticky top-0 z-30">
      {/* Left — Breadcrumb */}
      <div className="flex min-w-0 items-center gap-2">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Abrir menú"
        className="-ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      <nav className="flex min-w-0 items-center gap-1.5 text-sm text-zinc-500">
        <span className="hidden font-semibold text-zinc-900 sm:inline">Nexia</span>
        {breadcrumbs.map((label, i) => (
          <React.Fragment key={i}>
            <ChevronRight className={`h-3.5 w-3.5 shrink-0 text-zinc-400 ${i === 0 ? 'hidden sm:block' : ''} ${i < breadcrumbs.length - 1 ? 'max-sm:hidden' : ''}`} />
            <span className={i === breadcrumbs.length - 1 ? 'truncate text-zinc-900 font-medium' : 'hidden sm:inline'}>
              {label}
            </span>
          </React.Fragment>
        ))}
      </nav>
      </div>

      {/* Right — Tenant badge + role + avatar */}
      <div className="flex shrink-0 items-center gap-3 md:gap-4">
        {/* Condominium badge */}
        <div className="hidden md:flex items-center gap-1.5 text-xs font-medium text-zinc-600 bg-zinc-50 border border-zinc-200/70 rounded-md px-2 py-1">
          <Building2 className="h-3.5 w-3.5 text-zinc-500" />
          <span className="truncate max-w-[180px]">Condominio Activo</span>
        </div>

        {/* Role label */}
        <span className="hidden sm:inline text-xs font-medium text-zinc-500">
          {ROLE_LABELS[user.rol] || user.rol}
        </span>

        {/* User avatar */}
        <div className="h-7 w-7 rounded-full bg-zinc-900 flex items-center justify-center text-xs font-medium text-white ring-1 ring-zinc-900/10">
          {user.nombre_completo.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
