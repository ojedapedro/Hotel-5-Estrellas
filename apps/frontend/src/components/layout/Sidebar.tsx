import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import {
  LayoutDashboard,
  BedDouble,
  CalendarDays,
  UtensilsCrossed,
  Boxes,
  Calculator,
  Users,
  Crown,
  Moon,
  ShoppingCart,
  GlassWater,
  Wrench,
  UserCheck,
  TrendingUp,
  FileText,
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard Ejecutivo',
    path: '/dashboard',
    icon: LayoutDashboard,
    roles: ['SUPER_ADMIN', 'GERENTE_GENERAL', 'CONTADOR', 'SOCIO', 'RECEPCIONISTA'],
  },
  {
    name: 'Mapa 200 Habitaciones',
    path: '/pms/rooms',
    icon: BedDouble,
    roles: ['SUPER_ADMIN', 'GERENTE_GENERAL', 'RECEPCIONISTA', 'AUDITOR_NOCTURNO', 'TECNICO_MANTENIMIENTO'],
  },
  {
    name: 'Reservas y Check-in',
    path: '/pms/reservations',
    icon: CalendarDays,
    roles: ['SUPER_ADMIN', 'GERENTE_GENERAL', 'RECEPCIONISTA', 'AUDITOR_NOCTURNO'],
  },
  {
    name: 'Restaurante / POS',
    path: '/pos',
    icon: UtensilsCrossed,
    roles: ['SUPER_ADMIN', 'GERENTE_GENERAL', 'CAJERO_POS', 'MESERO'],
  },
  {
    name: 'Inventarios (5 Almacenes)',
    path: '/inventory',
    icon: Boxes,
    roles: ['SUPER_ADMIN', 'GERENTE_GENERAL', 'COMPRAS_ALMACEN', 'CONTADOR'],
  },
  {
    name: 'Compras y Proveedores',
    path: '/compras',
    icon: ShoppingCart,
    roles: ['SUPER_ADMIN', 'GERENTE_GENERAL', 'COMPRAS_ALMACEN', 'CONTADOR'],
  },
  {
    name: 'Eventos y Salones',
    path: '/eventos',
    icon: GlassWater,
    roles: ['SUPER_ADMIN', 'GERENTE_GENERAL', 'EJECUTIVO_EVENTOS'],
  },
  {
    name: 'Mantenimiento / Housekeeping',
    path: '/mantenimiento',
    icon: Wrench,
    roles: ['SUPER_ADMIN', 'GERENTE_GENERAL', 'TECNICO_MANTENIMIENTO', 'RECEPCIONISTA'],
  },
  {
    name: 'Nómina y RRHH',
    path: '/rrhh',
    icon: UserCheck,
    roles: ['SUPER_ADMIN', 'GERENTE_GENERAL', 'RRHH_NOMINA', 'CONTADOR'],
  },
  {
    name: 'Socios e Inversores',
    path: '/socios',
    icon: TrendingUp,
    roles: ['SUPER_ADMIN', 'GERENTE_GENERAL', 'CONTADOR', 'SOCIO'],
  },
  {
    name: 'Fiscal y SENIAT',
    path: '/fiscal',
    icon: FileText,
    roles: ['SUPER_ADMIN', 'GERENTE_GENERAL', 'CONTADOR'],
  },
  {
    name: 'Contabilidad Dual',
    path: '/contabilidad',
    icon: Calculator,
    roles: ['SUPER_ADMIN', 'GERENTE_GENERAL', 'CONTADOR', 'SOCIO'],
  },
  {
    name: 'Personal y Usuarios',
    path: '/admin/users',
    icon: Users,
    roles: ['SUPER_ADMIN', 'GERENTE_GENERAL', 'RRHH_NOMINA'],
  },
];

export const Sidebar: React.FC = () => {
  const { user } = useAuthStore();

  const userRole = user?.rol || '';
  const filteredNav = navItems.filter((item) => {
    if (userRole === 'SUPER_ADMIN') return true;
    return item.roles.includes(userRole);
  });

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col h-screen sticky top-0 z-50">
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold-400 via-gold-500 to-gold-700 flex items-center justify-center shadow-lg shadow-gold-500/20 text-slate-950 font-bold">
          <Crown className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-sm font-extrabold text-slate-100 tracking-wider">
            GRAN HOTEL
          </h1>
          <p className="text-[10px] font-semibold text-gold-400 uppercase tracking-widest">
            ★★★★★ Caracas
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Módulos del Sistema
        </div>
        {filteredNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-gold-500/20 to-gold-500/5 text-gold-400 border border-gold-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-900 bg-slate-950/40">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400">
            <Moon className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <p className="font-semibold text-slate-200">Auditoría 24/7</p>
            <p className="text-[11px] text-slate-500">Cierre diario 23:59</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
