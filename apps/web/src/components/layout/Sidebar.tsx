'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../stores/useAuth';
import {
  Building2,
  BarChart3,
  Home,
  Users,
  Wallet,
  Car,
  Palmtree,
  Settings,
  QrCode,
  CreditCard,
  Calendar,
  User as UserIcon,
  LogOut,
  LucideIcon,
  ShieldCheck,
  History,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

type RoleMenu = {
  [key: string]: NavItem[];
};

const MENU_ITEMS: RoleMenu = {
  SUPERADMIN: [
    { name: 'Condominios', href: '/sa/condominios', icon: Building2 },
    { name: 'Métricas Globales', href: '/sa/metricas', icon: BarChart3 },
    { name: 'Bitácora de Garita', href: '/dashboard/bitacora', icon: History },
  ],
  ADMIN_CONDOMINIO: [
    { name: 'Propiedades', href: '/dashboard/propiedades', icon: Home },
    { name: 'Residentes', href: '/dashboard/residentes', icon: Users },
    { name: 'Finanzas', href: '/dashboard/finanzas', icon: Wallet },
    { name: 'Marbetes', href: '/dashboard/marbetes', icon: Car },
    { name: 'Amenidades', href: '/dashboard/amenidades', icon: Palmtree },
    { name: 'Bitácora de Garita', href: '/dashboard/bitacora', icon: History },
    { name: 'Consola Garita', href: '/garita', icon: ShieldCheck },
    { name: 'Configuración', href: '/dashboard/configuracion', icon: Settings },
  ],
  GUARDIA: [
    { name: 'Consola Garita', href: '/garita', icon: ShieldCheck },
  ],
  RESIDENTE: [
    { name: 'Mis Cuotas', href: '/mi-cuenta/cuotas', icon: CreditCard },
    { name: 'Visitas y Accesos', href: '/visitas', icon: QrCode },
    { name: 'Reservas', href: '/mi-cuenta/reservas', icon: Calendar },
    { name: 'Mi Cuenta', href: '/mi-cuenta', icon: UserIcon },
  ],
};

type SidebarProps = {
  /** Mobile drawer visibility (ignored on md+ where the sidebar is always visible). */
  mobileOpen?: boolean;
  onClose?: () => void;
};

export function Sidebar({ mobileOpen = false, onClose }: SidebarProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  if (!user) return null;

  const navItems = MENU_ITEMS[user.rol] || [];

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      {/* Mobile backdrop */}
      <div
        aria-hidden="true"
        onClick={() => onClose?.()}
        className={cn(
          "fixed inset-0 z-40 bg-zinc-950/50 transition-opacity md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-zinc-950 text-zinc-100 border-r border-zinc-800/60 transition-transform duration-200 ease-out",
        "md:static md:z-auto md:h-dvh md:w-60 md:shrink-0 md:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="h-14 px-5 flex items-center justify-between shrink-0 font-semibold text-lg tracking-tight text-white">
        Nexia
        <button
          type="button"
          onClick={() => onClose?.()}
          aria-label="Cerrar menú"
          className="-mr-2 flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800/60 hover:text-white md:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onClose?.()}
              className={cn(
                "flex items-center gap-2.5 py-2.5 md:py-2 px-3 rounded-lg transition-colors text-sm md:text-xs font-medium",
                isActive 
                  ? "bg-zinc-800/80 text-white" 
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-zinc-800/60">
        <div className="flex items-center gap-2.5 mb-3 px-1">
          <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-200">
            {user.nombre_completo.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-medium text-zinc-100 truncate">{user.nombre_completo}</span>
            <span className="text-[11px] text-zinc-500 truncate">{user.rol}</span>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center justify-center w-full gap-2 px-3 py-2.5 md:py-2 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/60 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
    </>
  );
}
