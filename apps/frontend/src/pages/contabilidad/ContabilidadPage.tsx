import React, { useEffect, useState } from 'react';
import { api } from '../../lib/axios';
import { useHotelStore } from '../../stores/hotel.store';
import { formatUsd, formatBs } from '../../lib/utils';
import {
  Calculator,
  Plus,
  Lock,
  TrendingUp,
  TrendingDown,
  Scale,
  X,
} from 'lucide-react';

export const ContabilidadPage: React.FC = () => {
  const { tasaBcv } = useHotelStore();
  const [asientos, setAsientos] = useState<any[]>([]);
  const [planCuentas, setPlanCuentas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ASIENTOS' | 'PLAN' | 'PNL'>('ASIENTOS');

  // P&L state
  const [pnl, setPnl] = useState<any>({
    ingresosUsd: 12500,
    egresosUsd: 4200,
    utilidadNetaUsd: 8300,
  });

  const fetchData = async () => {
    try {
      const [asRes, planRes] = await Promise.all([
        api.get('/contabilidad/asientos'),
        api.get('/contabilidad/chart-of-accounts'),
      ]);
      if (asRes.data?.data) setAsientos(asRes.data.data);
      if (planRes.data?.data) setPlanCuentas(planRes.data.data);
    } catch (err) {
      console.error('Error al cargar datos contables', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-gold-400 uppercase tracking-widest">
            Módulo Financiero y Fiscal
          </span>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight mt-1 flex items-center gap-3">
            <Calculator className="w-7 h-7 text-gold-400" />
            Contabilidad General en Moneda Dual
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Partida doble simultánea en USD y Bolívares VES con tasa BCV congelada
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('ASIENTOS')}
            className={`px-4 py-2 rounded-xl transition-colors ${
              activeTab === 'ASIENTOS'
                ? 'bg-gold-500 text-slate-950 shadow-md shadow-gold-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Libro Diario
          </button>
          <button
            onClick={() => setActiveTab('PNL')}
            className={`px-4 py-2 rounded-xl transition-colors ${
              activeTab === 'PNL'
                ? 'bg-gold-500 text-slate-950 shadow-md shadow-gold-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Estado de Resultados (P&L)
          </button>
          <button
            onClick={() => setActiveTab('PLAN')}
            className={`px-4 py-2 rounded-xl transition-colors ${
              activeTab === 'PLAN'
                ? 'bg-gold-500 text-slate-950 shadow-md shadow-gold-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Plan de Cuentas
          </button>
        </div>
      </div>

      {/* Vista de Asientos (Libro Diario) */}
      {activeTab === 'ASIENTOS' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4 text-gold-400" /> Asientos Contables Registrados
            </h2>
            <span className="text-xs text-slate-400">
              Registros inmutables con partida doble obligatoria
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-6">Número</th>
                  <th className="py-3.5 px-6">Fecha</th>
                  <th className="py-3.5 px-6">Descripción</th>
                  <th className="py-3.5 px-6">Tipo</th>
                  <th className="py-3.5 px-6 text-right">Debe / Haber USD</th>
                  <th className="py-3.5 px-6 text-right">Debe / Haber Bs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {asientos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-500">
                      No hay asientos contables registrados aún.
                    </td>
                  </tr>
                ) : (
                  asientos.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-800/40">
                      <td className="py-3.5 px-6 font-mono font-bold text-gold-400">
                        {a.numero}
                      </td>
                      <td className="py-3.5 px-6 text-slate-400">
                        {a.fecha?.split('T')[0]}
                      </td>
                      <td className="py-3.5 px-6 font-semibold text-slate-100">
                        {a.descripcion}
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 uppercase">
                          {a.tipo}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono font-bold text-slate-100">
                        {formatUsd(Number(a.totalDebeUsd))}
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono text-slate-400">
                        {formatBs(Number(a.totalDebeBs))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vista de Estado de Resultados (P&L) */}
      {activeTab === 'PNL' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase mb-2">
                <TrendingUp className="w-4 h-4" /> Ingresos Totales
              </div>
              <div className="text-3xl font-black text-slate-100 font-mono">
                {formatUsd(pnl.ingresosUsd)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                ≈ {formatBs(pnl.ingresosUsd * tasaBcv)}
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase mb-2">
                <TrendingDown className="w-4 h-4" /> Costos y Gastos
              </div>
              <div className="text-3xl font-black text-slate-100 font-mono">
                {formatUsd(pnl.egresosUsd)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                ≈ {formatBs(pnl.egresosUsd * tasaBcv)}
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-gold-950/40 border border-gold-500/30">
              <div className="flex items-center gap-2 text-gold-400 text-xs font-bold uppercase mb-2">
                <Scale className="w-4 h-4" /> Utilidad Neta (Distribuible)
              </div>
              <div className="text-3xl font-black text-gold-400 font-mono">
                {formatUsd(pnl.utilidadNetaUsd)}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Base para el motor de reparto a socios (75% / 12.5% / 12.5%)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Vista de Plan de Cuentas */}
      {activeTab === 'PLAN' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h2 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider mb-4">
            Catálogo del Plan de Cuentas (Hasta 6 Niveles)
          </h2>
          <div className="space-y-1.5 font-mono text-xs">
            {planCuentas.map((c) => (
              <div
                key={c.id}
                style={{ paddingLeft: `${(c.nivel - 1) * 20}px` }}
                className={`py-2 px-3 rounded-xl flex items-center justify-between ${
                  !c.esMovimiento
                    ? 'bg-slate-950/70 font-bold text-gold-400'
                    : 'text-slate-300 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">{c.codigo}</span>
                  <span>{c.nombre}</span>
                </div>
                <span className="text-[10px] text-slate-500 uppercase">
                  {c.tipo}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
