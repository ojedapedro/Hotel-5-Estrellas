import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import {
  Wrench, Sparkles, AlertTriangle, CheckCircle, Clock, Plus, X, Filter
} from 'lucide-react';

interface OrdenTrabajo {
  id: string;
  correlativo: string;
  tipo: string;
  estado: string;
  prioridad: string;
  descripcion: string;
  areaComun?: string;
  habitacion?: { numero: string; piso: number };
  asignadoA?: { nombre: string };
  solicitante?: { nombre: string };
  creadoEn: string;
}

interface HabitacionHK {
  id: string;
  numero: string;
  piso: number;
  tipo: string;
  estadoOcupacion: string;
  estadoHousekeeping: 'LIMPIA' | 'SUCIA' | 'EN_LIMPIEZA' | 'BLOQUEADA';
}

interface KPIs {
  pendientes: number;
  enProgreso: number;
  completadasHoy: number;
  urgentes: number;
  habitacionesSucias: number;
}

const PRIORIDAD_COLORS: Record<string, string> = {
  URGENTE: 'text-red-400 bg-red-900/40 border-red-700/50',
  ALTA: 'text-orange-400 bg-orange-900/40 border-orange-700/50',
  NORMAL: 'text-blue-400 bg-blue-900/40 border-blue-700/50',
  BAJA: 'text-gray-400 bg-gray-800 border-gray-700',
};

const HK_COLORS: Record<string, string> = {
  LIMPIA: 'bg-green-900/40 text-green-400 border-green-700/50',
  SUCIA: 'bg-red-900/40 text-red-400 border-red-700/50',
  EN_LIMPIEZA: 'bg-yellow-900/40 text-yellow-400 border-yellow-700/50',
  BLOQUEADA: 'bg-gray-800 text-gray-400 border-gray-700',
};

export default function MantenimientoPage() {
  const [tab, setTab] = useState<'housekeeping' | 'ordenes'>('housekeeping');
  const [habitaciones, setHabitaciones] = useState<HabitacionHK[]>([]);
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>([]);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterPiso, setFilterPiso] = useState<number | 'TODOS'>('TODOS');
  const [filterHK, setFilterHK] = useState<string>('TODOS');

  // Modal OT
  const [showNewOT, setShowNewOT] = useState(false);
  const [otForm, setOtForm] = useState({
    tipo: 'MANTENIMIENTO_CORRECTIVO',
    prioridad: 'NORMAL',
    descripcion: '',
    habitacionId: '',
    areaComun: '',
  });

  useEffect(() => {
    fetchData();
  }, [tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [hkRes, otRes, kpiRes] = await Promise.all([
        api.get('/mantenimiento/housekeeping'),
        api.get('/mantenimiento/ordenes'),
        api.get('/mantenimiento/kpis'),
      ]);
      setHabitaciones(hkRes.data);
      setOrdenes(otRes.data);
      setKpis(kpiRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateHK = async (habitacionId: string, nuevoEstado: string) => {
    try {
      await api.patch('/mantenimiento/housekeeping', {
        habitacionId,
        estado: nuevoEstado,
      });
      setHabitaciones(prev =>
        prev.map(h => (h.id === habitacionId ? { ...h, estadoHousekeeping: nuevoEstado as any } : h))
      );
      // Refresh KPIs
      const kpiRes = await api.get('/mantenimiento/kpis');
      setKpis(kpiRes.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al actualizar habitación');
    }
  };

  const handleCreateOT = async () => {
    try {
      await api.post('/mantenimiento/ordenes', otForm);
      setShowNewOT(false);
      setOtForm({
        tipo: 'MANTENIMIENTO_CORRECTIVO',
        prioridad: 'NORMAL',
        descripcion: '',
        habitacionId: '',
        areaComun: '',
      });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al crear orden de trabajo');
    }
  };

  const handleUpdateEstadoOT = async (id: string, nuevoEstado: string) => {
    try {
      await api.patch(`/mantenimiento/ordenes/${id}`, { estado: nuevoEstado });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al actualizar orden');
    }
  };

  const filteredHabitaciones = habitaciones.filter(h => {
    if (filterPiso !== 'TODOS' && h.piso !== filterPiso) return false;
    if (filterHK !== 'TODOS' && h.estadoHousekeeping !== filterHK) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gold-400">Mantenimiento y Housekeeping</h1>
          <p className="text-gray-400 text-sm mt-1">Control de limpieza de pisos y órdenes técnicas preventivas/correctivas</p>
        </div>
        <button
          onClick={() => setShowNewOT(true)}
          className="flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-black px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
        >
          <Plus size={16} />
          Nueva Orden de Trabajo
        </button>
      </div>

      {/* KPIs */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={18} className="text-yellow-400" />
              <span className="text-gray-400 text-xs">OT Pendientes</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400">{kpis.pendientes}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wrench size={18} className="text-blue-400" />
              <span className="text-gray-400 text-xs">En Reparación</span>
            </div>
            <p className="text-2xl font-bold text-blue-400">{kpis.enProgreso}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={18} className="text-green-400" />
              <span className="text-gray-400 text-xs">Completadas Hoy</span>
            </div>
            <p className="text-2xl font-bold text-green-400">{kpis.completadasHoy}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={18} className="text-red-400" />
              <span className="text-gray-400 text-xs">Urgencias</span>
            </div>
            <p className="text-2xl font-bold text-red-400">{kpis.urgentes}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={18} className="text-purple-400" />
              <span className="text-gray-400 text-xs">Habitaciones Sucias</span>
            </div>
            <p className="text-2xl font-bold text-purple-400">{kpis.habitacionesSucias}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-lg p-1 w-fit">
        {(['housekeeping', 'ordenes'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
              tab === t ? 'bg-gold-500 text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t === 'housekeeping' ? 'Tablero Housekeeping' : 'Órdenes de Trabajo (OT)'}
          </button>
        ))}
      </div>

      {/* Tab: Housekeeping */}
      {tab === 'housekeeping' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap gap-3 items-center bg-gray-800 p-4 rounded-xl border border-gray-700">
            <Filter size={16} className="text-gold-400" />
            <span className="text-xs text-gray-400 uppercase font-semibold">Filtros:</span>
            <select
              value={filterPiso}
              onChange={e => setFilterPiso(e.target.value === 'TODOS' ? 'TODOS' : Number(e.target.value))}
              className="bg-gray-900 border border-gray-700 text-white text-xs px-3 py-1.5 rounded-lg"
            >
              <option value="TODOS">Todos los Pisos (1-10)</option>
              {Array.from({ length: 10 }, (_, i) => i + 1).map(p => (
                <option key={p} value={p}>Piso {p}</option>
              ))}
            </select>

            <select
              value={filterHK}
              onChange={e => setFilterHK(e.target.value)}
              className="bg-gray-900 border border-gray-700 text-white text-xs px-3 py-1.5 rounded-lg"
            >
              <option value="TODOS">Todos los Estados HK</option>
              <option value="SUCIA">Sucia</option>
              <option value="EN_LIMPIEZA">En Limpieza</option>
              <option value="LIMPIA">Limpia / Lista</option>
              <option value="BLOQUEADA">Bloqueada</option>
            </select>
          </div>

          {/* Room Matrix Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-10 gap-2.5">
            {filteredHabitaciones.map(h => (
              <div
                key={h.id}
                className={`border rounded-xl p-2.5 flex flex-col justify-between transition-all ${HK_COLORS[h.estadoHousekeeping]}`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">#{h.numero}</span>
                    <span className="text-[10px] text-gray-400">P{h.piso}</span>
                  </div>
                  <span className="text-[10px] block opacity-80 mt-0.5">{h.estadoHousekeeping}</span>
                </div>
                <div className="mt-3 flex gap-1">
                  {h.estadoHousekeeping !== 'LIMPIA' && (
                    <button
                      onClick={() => handleUpdateHK(h.id, 'LIMPIA')}
                      title="Marcar como Limpia"
                      className="w-full bg-green-600/80 hover:bg-green-600 text-white rounded text-[10px] py-1 font-semibold"
                    >
                      Limpia
                    </button>
                  )}
                  {h.estadoHousekeeping !== 'SUCIA' && (
                    <button
                      onClick={() => handleUpdateHK(h.id, 'SUCIA')}
                      title="Marcar como Sucia"
                      className="w-full bg-red-600/80 hover:bg-red-600 text-white rounded text-[10px] py-1 font-semibold"
                    >
                      Sucia
                    </button>
                  )}
                  {h.estadoHousekeeping !== 'EN_LIMPIEZA' && (
                    <button
                      onClick={() => handleUpdateHK(h.id, 'EN_LIMPIEZA')}
                      title="En Proceso"
                      className="w-full bg-yellow-600/80 hover:bg-yellow-600 text-white rounded text-[10px] py-1 font-semibold"
                    >
                      Limpiando
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Ordenes de Trabajo */}
      {tab === 'ordenes' && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 text-gray-400">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Correlativo</th>
                  <th className="px-4 py-3 text-left font-medium">Ubicación</th>
                  <th className="px-4 py-3 text-left font-medium">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium">Descripción</th>
                  <th className="px-4 py-3 text-center font-medium">Prioridad</th>
                  <th className="px-4 py-3 text-center font-medium">Estado</th>
                  <th className="px-4 py-3 text-left font-medium">Asignado</th>
                  <th className="px-4 py-3 text-center font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-8 text-gray-400">Cargando órdenes...</td></tr>
                ) : ordenes.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-8 text-gray-400">No hay órdenes de trabajo activas</td></tr>
                ) : ordenes.map(ot => (
                  <tr key={ot.id} className="hover:bg-gray-750 transition-colors">
                    <td className="px-4 py-3 font-mono text-gold-400 font-medium">{ot.correlativo}</td>
                    <td className="px-4 py-3 text-white">
                      {ot.habitacion ? `Habitación #${ot.habitacion.numero} (Piso ${ot.habitacion.piso})` : (ot.areaComun || 'Área General')}
                    </td>
                    <td className="px-4 py-3 text-gray-300 text-xs">
                      {ot.tipo.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 py-3 text-gray-200 max-w-xs truncate">{ot.descripcion}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs border font-semibold ${PRIORIDAD_COLORS[ot.prioridad] || 'text-gray-400'}`}>
                        {ot.prioridad}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-300">
                        {ot.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{ot.asignadoA?.nombre || 'Sin asignar'}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {ot.estado === 'PENDIENTE' && (
                          <button
                            onClick={() => handleUpdateEstadoOT(ot.id, 'EN_PROGRESO')}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs font-medium"
                          >
                            Iniciar
                          </button>
                        )}
                        {ot.estado === 'EN_PROGRESO' && (
                          <button
                            onClick={() => handleUpdateEstadoOT(ot.id, 'COMPLETADA')}
                            className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-medium"
                          >
                            Resolver
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Nueva OT */}
      {showNewOT && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-md border border-gray-700 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-700">
              <h2 className="text-lg font-bold text-gold-400">Crear Orden de Trabajo</h2>
              <button onClick={() => setShowNewOT(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Tipo de Trabajo</label>
                  <select
                    value={otForm.tipo}
                    onChange={e => setOtForm(prev => ({ ...prev, tipo: e.target.value }))}
                    className="w-full bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm"
                  >
                    <option value="MANTENIMIENTO_CORRECTIVO">Correctivo</option>
                    <option value="MANTENIMIENTO_PREVENTIVO">Preventivo</option>
                    <option value="LIMPIEZA">Limpieza Especial</option>
                    <option value="REPARACION">Reparación</option>
                    <option value="INSTALACION">Instalación</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Prioridad</label>
                  <select
                    value={otForm.prioridad}
                    onChange={e => setOtForm(prev => ({ ...prev, prioridad: e.target.value }))}
                    className="w-full bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm"
                  >
                    <option value="BAJA">Baja</option>
                    <option value="NORMAL">Normal</option>
                    <option value="ALTA">Alta</option>
                    <option value="URGENTE">🚨 Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Habitación (Opcional)</label>
                <select
                  value={otForm.habitacionId}
                  onChange={e => setOtForm(prev => ({ ...prev, habitacionId: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm"
                >
                  <option value="">Seleccione si aplica...</option>
                  {habitaciones.map(h => (
                    <option key={h.id} value={h.id}>Hab #{h.numero} (Piso {h.piso})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Área Común (si no es habitación)</label>
                <input
                  value={otForm.areaComun}
                  onChange={e => setOtForm(prev => ({ ...prev, areaComun: e.target.value }))}
                  placeholder="Lobby, Piscina, Restaurante El Mirador, Ascensor #2"
                  className="w-full bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Descripción del Problema *</label>
                <textarea
                  rows={3}
                  value={otForm.descripcion}
                  onChange={e => setOtForm(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Describa la falla técnica, fuga de agua, bombillo, o equipo dañado..."
                  className="w-full bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-700">
              <button
                onClick={() => setShowNewOT(false)}
                className="flex-1 py-2 border border-gray-600 text-gray-300 rounded-lg text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateOT}
                className="flex-1 py-2 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg text-sm"
              >
                Emitir Orden
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
