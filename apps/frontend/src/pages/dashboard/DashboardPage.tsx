import React, { useEffect, useState } from 'react';
import { api } from '../../lib/axios';
import { useHotelStore } from '../../stores/hotel.store';
import { useAuthStore } from '../../stores/auth.store';
import { formatUsd, formatBs } from '../../lib/utils';
import {
  TrendingUp,
  BedDouble,
  DollarSign,
  Percent,
  AlertTriangle,
  Moon,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { tasaBcv } = useHotelStore();
  const [stats, setStats] = useState<any>({
    total: 200,
    disponibles: 195,
    ocupadas: 3,
    limpieza: 1,
    mantenimiento: 1,
    ocupacionPorcentaje: 2,
  });
  const [rooms, setRooms] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditMessage, setAuditMessage] = useState<string | null>(null);

  useEffect(() => {
    // Cargar mapa y estadísticas de habitaciones
    api.get('/pms/rooms/map')
      .then((res) => {
        if (res.data?.stats) setStats(res.data.stats);
        if (res.data?.rooms) setRooms(res.data.rooms);
      })
      .catch(() => {});

    // Cargar alertas de stock
    api.get('/inventory/alerts')
      .then((res) => {
        if (res.data?.data) setAlerts(res.data.data);
      })
      .catch(() => {});
  }, []);

  const handleRunAudit = async () => {
    setLoadingAudit(true);
    setAuditMessage(null);
    try {
      const res = await api.post('/tasks/night-audit/run');
      setAuditMessage(`Auditoría nocturna completada. Total cargos: $${res.data?.data?.totalCargosUsd || 0} USD`);
      // Recargar mapa
      const mapRes = await api.get('/pms/rooms/map');
      if (mapRes.data?.stats) setStats(mapRes.data.stats);
      if (mapRes.data?.rooms) setRooms(mapRes.data.rooms);
    } catch (err: any) {
      setAuditMessage(err.response?.data?.message || 'Error al ejecutar auditoría');
    } finally {
      setLoadingAudit(false);
    }
  };

  // Métricas hoteleras 5 estrellas
  const adr = 135.00; // Average Daily Rate estimado
  const revPar = (adr * stats.ocupacionPorcentaje) / 100;
  const revenueDiaUsd = stats.ocupadas * adr;
  const revenueDiaBs = revenueDiaUsd * tasaBcv;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 rounded-3xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-xs font-bold text-gold-400 uppercase tracking-widest">
            Panel de Control Ejecutivo
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 mt-1">
            Bienvenido, {user?.nombre} {user?.apellido}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Operaciones 24/7 en tiempo real · 200 Habitaciones · Moneda Dual VES/USD
          </p>
        </div>

        {/* Auditoría Nocturna Trigger */}
        {['SUPER_ADMIN', 'GERENTE_GENERAL', 'AUDITOR_NOCTURNO'].includes(user?.rol || '') && (
          <div className="flex flex-col items-end gap-2 relative z-10">
            <button
              onClick={handleRunAudit}
              disabled={loadingAudit}
              className="bg-slate-800 hover:bg-gold-500/10 text-gold-400 border border-gold-500/30 font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 text-xs shadow-lg disabled:opacity-50"
            >
              <Moon className="w-4 h-4 text-gold-400" />
              {loadingAudit ? 'Ejecutando...' : 'Ejecutar Auditoría Nocturna (23:59)'}
            </button>
            {auditMessage && (
              <span className="text-[11px] text-emerald-400 font-medium">
                {auditMessage}
              </span>
            )}
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Ocupación */}
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Ocupación Actual</span>
            <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-100 tracking-tight">
            {stats.ocupacionPorcentaje}%
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="text-emerald-400 font-semibold">{stats.ocupadas} ocupadas</span> de 200 habitaciones
          </p>
        </div>

        {/* ADR (Average Daily Rate) */}
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Tarifa Media (ADR)</span>
            <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-100 tracking-tight">
            {formatUsd(adr)}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            ≈ {formatBs(adr * tasaBcv)} por noche
          </p>
        </div>

        {/* RevPAR */}
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">RevPAR</span>
            <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400">
              <BedDouble className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-100 tracking-tight">
            {formatUsd(revPar)}
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Revenue por habitación disponible
          </p>
        </div>

        {/* Revenue Proyectado Hoy */}
        <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Revenue Hab. Hoy</span>
            <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-gold-400 tracking-tight">
            {formatUsd(revenueDiaUsd)}
          </div>
          <p className="text-xs text-slate-400 mt-2 truncate">
            {formatBs(revenueDiaBs)}
          </p>
        </div>
      </div>

      {/* Mini Mapa de las 200 Habitaciones y Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vista rápida de las 200 habitaciones */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-100">
                Matriz Visual de 200 Habitaciones
              </h2>
              <p className="text-xs text-slate-400">
                10 pisos · 20 por piso · Estado en tiempo real
              </p>
            </div>
            <Link
              to="/pms/rooms"
              className="text-xs font-bold text-gold-400 hover:text-gold-300 flex items-center gap-1 transition-colors"
            >
              Ver Mapa Completo <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mini Grid 10x20 */}
          <div className="grid grid-cols-20 gap-1 p-3 bg-slate-950/60 rounded-2xl border border-slate-800/60 max-h-56 overflow-y-auto">
            {rooms.slice(0, 200).map((r) => {
              let bg = 'bg-emerald-500/40 border-emerald-500/60';
              if (r.estado === 'OCUPADA') bg = 'bg-rose-500 border-rose-400 shadow-sm shadow-rose-500/30';
              if (r.estado === 'LIMPIEZA') bg = 'bg-amber-400 border-amber-300';
              if (r.estado === 'MANTENIMIENTO') bg = 'bg-orange-500 border-orange-400';
              if (r.estado === 'BLOQUEADA') bg = 'bg-slate-600 border-slate-500';

              return (
                <div
                  key={r.id}
                  title={`Hab. ${r.numero} - ${r.estado}`}
                  className={`h-4 rounded border text-[8px] flex items-center justify-center font-bold text-slate-950 cursor-pointer hover:scale-125 transition-transform ${bg}`}
                >
                  {r.numero.slice(-2)}
                </div>
              );
            })}
          </div>

          {/* Leyenda rápida */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Disponible ({stats.disponibles})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-rose-500" /> Ocupada ({stats.ocupadas})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-amber-400" /> Limpieza ({stats.limpieza})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-orange-500" /> Mantenimiento ({stats.mantenimiento})
            </span>
          </div>
        </div>

        {/* Panel Lateral: Alertas y Enlaces Rápidos */}
        <div className="space-y-6">
          {/* Alertas */}
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-extrabold text-slate-100">
                Alertas Operativas ({alerts.length})
              </h2>
            </div>

            {alerts.length === 0 ? (
              <div className="text-xs text-slate-400 p-4 rounded-xl bg-slate-950/40 text-center">
                ✨ Todos los almacenes operan con stock seguro
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {alerts.map((a, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-200">{a.articulo?.nombre}</p>
                      <p className="text-[11px] text-slate-400">{a.almacen?.nombre}</p>
                    </div>
                    <span className="font-bold text-rose-400">
                      {Number(a.cantidad)} {a.articulo?.unidadMedida}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Accesos Rápidos */}
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6">
            <h2 className="text-base font-extrabold text-slate-100 mb-3">
              Operaciones Frecuentes
            </h2>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                to="/pms/reservations"
                className="p-3 rounded-xl bg-slate-800/60 hover:bg-gold-500/10 border border-slate-700/60 text-slate-200 font-semibold text-center transition-colors"
              >
                🛎️ Check-in Huésped
              </Link>
              <Link
                to="/pos"
                className="p-3 rounded-xl bg-slate-800/60 hover:bg-gold-500/10 border border-slate-700/60 text-slate-200 font-semibold text-center transition-colors"
              >
                🍽️ Punto de Venta POS
              </Link>
              <Link
                to="/inventory"
                className="p-3 rounded-xl bg-slate-800/60 hover:bg-gold-500/10 border border-slate-700/60 text-slate-200 font-semibold text-center transition-colors"
              >
                📦 Entrada Almacén
              </Link>
              <Link
                to="/contabilidad"
                className="p-3 rounded-xl bg-slate-800/60 hover:bg-gold-500/10 border border-slate-700/60 text-slate-200 font-semibold text-center transition-colors"
              >
                📊 Asiento Contable
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
