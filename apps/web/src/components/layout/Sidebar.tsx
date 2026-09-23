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
  Package,
  Phone,
  CreditCard,
  History,
  Calendar,
  User as UserIcon,
  LogOut,
  LucideIcon
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
  ],
  ADMIN_CONDOMINIO: [
    { name: 'Propiedades', href: '/dashboard/propiedades', icon: Home },
    { name: 'Residentes', href: '/dashboard/residentes', icon: Users },
    { name: 'Finanzas', href: '/dashboard/finanzas', icon: Wallet },
    { name: 'Marbetes', href: '/dashboard/marbetes', icon: Car },
    { name: 'Amenidades', href: '/dashboard/amenidades', icon: Palmtree },
    { name: 'Configuración', href: '/dashboard/configuracion', icon: Settings },
  ],
  GUARDIA: [
    { name: 'Escanear QR', href: '/garita', icon: QrCode },
    { name: 'Deliveries Esperados', href: '/garita/deliveries', icon: Package },
    { name: 'Verificar Residente', href: '/garita/verificar', icon: Phone },
  ],
  RESIDENTE: [
    { name: 'Mis Cuotas', href: '/mi-cuenta/cuotas', icon: CreditCard },
    { name: 'Mis Visitas', href: '/mi-cuenta/visitas', icon: History },
    { name: 'Deliveries', href: '/mi-cuenta/deliveries', icon: Package },
    { name: 'Reservas', href: '/mi-cuenta/reservas', icon: Calendar },
    { name: 'Mi Cuenta', href: '/mi-cuenta', icon: UserIcon },
  ],
};

export function Sidebar() {
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
    <div className="flex flex-col w-64 h-screen bg-zinc-900 text-zinc-100 border-r border-zinc-800">
      <div className="p-6 flex items-center gap-2 font-bold text-2xl">
        <Building2 className="h-6 w-6 text-indigo-500" />
        Nexia
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                isActive 
                  ? "bg-indigo-600 text-white font-medium" 
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-indigo-400">
            {user.nombre_completo.charAt(0).toUpperCase()}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium truncate">{user.nombre_completo}</span>
            <span className="text-xs text-zinc-500 truncate">{user.rol}</span>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center justify-center w-full gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
