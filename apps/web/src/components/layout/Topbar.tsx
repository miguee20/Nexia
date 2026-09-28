'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../stores/useAuth';
import { Building2, ChevronRight } from 'lucide-react';

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

export function Topbar() {
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
    <header className="h-14 border-b border-zinc-200 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0">
      {/* Left — Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-zinc-500">
        <span className="font-semibold text-zinc-900">Nexia</span>
        {breadcrumbs.map((label, i) => (
          <React.Fragment key={i}>
            <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
            <span className={i === breadcrumbs.length - 1 ? 'text-zinc-900 font-medium' : ''}>
              {label}
            </span>
          </React.Fragment>
        ))}
      </nav>

      {/* Right — Tenant badge + role + avatar */}
      <div className="flex items-center gap-4">
        {/* Condominium badge */}
        <div className="hidden md:flex items-center gap-1.5 text-xs font-medium text-zinc-600 bg-zinc-100 border border-zinc-200/80 rounded-lg px-2.5 py-1">
          <Building2 className="h-3.5 w-3.5 text-zinc-500" />
          <span className="truncate max-w-[180px]">Condominio Activo</span>
        </div>

        {/* Role label */}
        <span className="hidden sm:inline text-xs font-medium text-zinc-500">
          {ROLE_LABELS[user.rol] || user.rol}
        </span>

        {/* User avatar */}
        <div className="h-8 w-8 rounded-full bg-zinc-900 flex items-center justify-center text-xs font-bold text-white">
          {user.nombre_completo.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
