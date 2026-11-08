import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import {
  Calendar, Users, DollarSign, CheckCircle, Plus, X, ChevronRight
} from 'lucide-react';

interface Evento {
  id: string; correlativo: string; nombreEvento: string; tipoEvento: string;
  clienteNombre: string; clienteContacto: string; estado: string;
  fechaInicio: string; fechaFin: string; numeroPersonas: number;
  totalUsd: number; totalBs: number;
  salon: { nombre: string; capacidadMaxima: number };
  ejecutivoCuentas: { nombre: string };
}
interface Salon { id: string; nombre: string; capacidadMaxima: number; precioHoraUsd?: number }
interface KPIs { eventosMes: number; eventosConfirmados: number; ingresosMesUsd: number; ingresosMesBs: number }

const TIPO_ICONS: Record<string, string> = {
  BODA: '💍', CONFERENCIA: '🎤', CUMPLEANOS: '🎂',
  REUNION_CORPORATIVA: '🏢', CENA_GALA: '🥂', COCTEL: '🍸', OTRO: '📋',
};

const ESTADO_COLORS: Record<string, string> = {
  COTIZACION: 'text-yellow-400 bg-yellow-900/40',
  CONFIRMADO: 'text-blue-400 bg-blue-900/40',
  EN_CURSO: 'text-green-400 bg-green-900/40',
  FINALIZADO: 'text-gray-400 bg-gray-800',
  CANCELADO: 'text-red-400 bg-red-900/40',
};

export default function EventosPage() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [salones, setSalones] = useState<Salon[]>([]);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [filterEstado, setFilterEstado] = useState('');

  const [form, setForm] = useState({
    nombreEvento: '', tipoEvento: 'CONFERENCIA', clienteNombre: '', clienteContacto: '',
    clienteRif: '', fechaInicio: '', fechaFin: '', numeroPersonas: 50,
    salonId: '', precioPersonaUsd: 0, notas: '',
  });

  useEffect(() => { fetchData(); }, [filterEstado]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [evRes, salRes, kpiRes] = await Promise.all([
        api.get('/eventos', { params: filterEstado ? { estado: filterEstado } : {} }),
        api.get('/eventos/salones'),
        api.get('/eventos/kpis'),
      ]);
      setEventos(evRes.data);
      setSalones(salRes.data);
      setKpis(kpiRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const saveEvento = async () => {
    try {
      await api.post('/eventos', form);
      setShowNew(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Error al crear evento');
    }
  };

  const confirmarEvento = async (id: string) => {
    try {
      await api.patch(`/eventos/${id}/confirmar`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Error');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gold-400">Eventos y Banquetes</h1>
          <p className="text-gray-400 text-sm mt-1">Gestión de eventos, salones y banquetes</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-black px-4 py-2 rounded-lg font-semibold text-sm"
        >
          <Plus size={16} />
          Nueva Cotización
        </button>
      </div>

      {/* KPIs */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Eventos este mes', value: kpis.eventosMes, icon: Calendar, color: 'text-blue-400' },
            { label: 'Confirmados', value: kpis.eventosConfirmados, icon: CheckCircle, color: 'text-green-400' },
            { label: 'Ingresos USD (mes)', value: `$${kpis.ingresosMesUsd.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-gold-400' },
            { label: 'Ingresos Bs (mes)', value: `Bs ${kpis.ingresosMesBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'text-purple-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={18} className={color} />
                <span className="text-gray-400 text-xs">{label}</span>
              </div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-3 items-center">
        <select
          value={filterEstado}
          onChange={e => setFilterEstado(e.target.value)}
          className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm"
        >
          <option value="">Todos</option>
          {Object.keys(ESTADO_COLORS).map(e => (
            <option key={e} value={e}>{e.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <span className="text-gray-400 text-sm">{eventos.length} eventos</span>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="col-span-3 text-center text-gray-400 py-8">Cargando...</p>
        ) : eventos.length === 0 ? (
          <div className="col-span-3 text-center py-16">
            <Calendar size={48} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No hay eventos registrados</p>
          </div>
        ) : eventos.map(ev => (
          <div key={ev.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-gold-500/50 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{TIPO_ICONS[ev.tipoEvento] ?? '📋'}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${ESTADO_COLORS[ev.estado]}`}>
                    {ev.estado.replace(/_/g, ' ')}
                  </span>
                </div>
                <h3 className="font-semibold text-white mt-1">{ev.nombreEvento}</h3>
                <p className="text-gray-400 text-xs font-mono">{ev.correlativo}</p>
              </div>
            </div>
            <div className="space-y-1 text-sm mb-3">
              <div className="flex items-center gap-2 text-gray-300">
                <Users size={14} className="text-gray-400" />
                <span>{ev.clienteNombre}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Calendar size={14} />
                <span>{new Date(ev.fechaInicio).toLocaleDateString('es-VE')} → {new Date(ev.fechaFin).toLocaleDateString('es-VE')}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <span className="w-3.5 text-center">👥</span>
                <span>{ev.numeroPersonas} personas</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <span className="w-3.5 text-center">🏛️</span>
                <span>{ev.salon.nombre}</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-700">
              <div>
                <p className="text-gold-400 font-bold">${Number(ev.totalUsd).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
                <p className="text-gray-500 text-xs">Bs {Number(ev.totalBs).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</p>
              </div>
              {ev.estado === 'COTIZACION' && (
                <button
                  onClick={() => confirmarEvento(ev.id)}
                  className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium"
                >
                  <CheckCircle size={12} />
                  Confirmar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* New Event Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-lg border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-700">
              <h2 className="text-lg font-bold text-gold-400">Nueva Cotización de Evento</h2>
              <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              {[
                { label: 'Nombre del evento *', key: 'nombreEvento', placeholder: 'Boda Rivera-González' },
                { label: 'Cliente / Empresa *', key: 'clienteNombre', placeholder: 'Empresa XYZ' },
                { label: 'Contacto (Tel/Email) *', key: 'clienteContacto', placeholder: '+58 412 000 0000' },
                { label: 'RIF (opcional)', key: 'clienteRif', placeholder: 'J-00000000-0' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-400 mb-1">{label}</label>
                  <input
                    value={(form as any)[key]}
                    onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm"
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Tipo</label>
                  <select
                    value={form.tipoEvento}
                    onChange={e => setForm(prev => ({ ...prev, tipoEvento: e.target.value }))}
                    className="w-full bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm"
                  >
                    {Object.keys(TIPO_ICONS).map(t => (
                      <option key={t} value={t}>{TIPO_ICONS[t]} {t.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Salón *</label>
                  <select
                    value={form.salonId}
                    onChange={e => setForm(prev => ({ ...prev, salonId: e.target.value }))}
                    className="w-full bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm"
                  >
                    <option value="">Seleccionar...</option>
                    {salones.map(s => (
                      <option key={s.id} value={s.id}>{s.nombre} ({s.capacidadMaxima} pax)</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Fecha inicio *</label>
                  <input
                    type="datetime-local"
                    value={form.fechaInicio}
                    onChange={e => setForm(prev => ({ ...prev, fechaInicio: e.target.value }))}
                    className="w-full bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Fecha fin *</label>
                  <input
                    type="datetime-local"
                    value={form.fechaFin}
                    onChange={e => setForm(prev => ({ ...prev, fechaFin: e.target.value }))}
                    className="w-full bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Nº personas *</label>
                  <input
                    type="number" min={1}
                    value={form.numeroPersonas}
                    onChange={e => setForm(prev => ({ ...prev, numeroPersonas: +e.target.value }))}
                    className="w-full bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Precio/persona USD</label>
                  <input
                    type="number" min={0}
                    value={form.precioPersonaUsd}
                    onChange={e => setForm(prev => ({ ...prev, precioPersonaUsd: +e.target.value }))}
                    className="w-full bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Notas</label>
                <textarea
                  rows={2}
                  value={form.notas}
                  onChange={e => setForm(prev => ({ ...prev, notas: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-700">
              <button
                onClick={() => setShowNew(false)}
                className="flex-1 py-2 border border-gray-600 text-gray-300 rounded-lg text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={saveEvento}
                className="flex-1 py-2 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg text-sm"
              >
                Crear Cotización
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
