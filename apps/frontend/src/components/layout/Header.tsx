import React, { useEffect } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { useHotelStore } from '../../stores/hotel.store';
import { api } from '../../lib/axios';
import { Bell, LogOut, ShieldCheck, DollarSign, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Header: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { tasaBcv, setTasaBcv } = useHotelStore();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/bcv/current')
      .then((res) => {
        if (res.data?.data?.tasaUsd) {
          setTasaBcv(Number(res.data.data.tasaUsd));
        }
      })
      .catch(() => {});
  }, [setTasaBcv]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-4">
        {/* Tasa BCV Destacada */}
        <div className="flex items-center gap-2 bg-slate-800/90 border border-gold-500/30 px-3.5 py-1.5 rounded-full shadow-inner">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <DollarSign className="w-4 h-4 text-gold-400" />
          <span className="text-xs text-slate-300 font-medium">Tasa BCV Oficial:</span>
          <span className="text-sm font-bold text-gold-400 tracking-wide">
            Bs. {tasaBcv.toFixed(2)} / USD
          </span>
        </div>
      </div>

      <div className="flex items-center gap-5">
        {/* Notificaciones */}
        <button
          title="Notificaciones"
          className="relative p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gold-500 rounded-full" />
        </button>

        {/* Separador */}
        <div className="h-6 w-px bg-slate-800" />

        {/* Info Usuario */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-gold-600 to-gold-400 flex items-center justify-center text-slate-950 font-bold text-sm shadow-md">
            {user?.nombre?.[0] || 'U'}
          </div>
          <div className="text-left hidden md:block">
            <p className="text-sm font-semibold text-slate-200 leading-tight">
              {user?.nombre} {user?.apellido}
            </p>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gold-400">
              <ShieldCheck className="w-3 h-3" />
              {user?.rol?.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Cerrar Sesión */}
        <button
          onClick={handleLogout}
          title="Cerrar Sesión"
          className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
