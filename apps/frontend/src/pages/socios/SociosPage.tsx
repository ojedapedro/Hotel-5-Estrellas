import { useState, useEffect } from 'react';
import api from '../../lib/axios';
import {
  Users,
  TrendingUp,
  DollarSign,
  PlusCircle,
  CheckCircle,
  Lock,
  CreditCard,
  Eye,
  RefreshCw,
} from 'lucide-react';

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface Socio {
  id: string;
  nombre: string;
  rif: string;
  email: string;
  telefono: string;
  porcentajeParticipacion: string;
  banco: string;
  numeroCuenta: string;
  activo: boolean;
  _count: { pagosDistribucion: number };
}

interface SociosResponse {
  socios: Socio[];
  totalSocios: number;
  sumaPorcentajes: number;
  participacionCompleta: boolean;
}

interface LineaDist {
  socio: { nombre: string; rif: string; porcentajeParticipacion: string };
  porcentaje: string;
  montoUsd: string;
  montoBs: string;
  estadoPago: string;
  referenciaPago?: string;
  fechaPago?: string;
}

interface Distribucion {
  id: string;
  correlativo: string;
  periodoNombre: string;
  anio: number;
  mes: number;
  estado: string;
  utilidadNetaUsd: string;
  montoDistribuibleUsd: string;
  montoDistribuibleBs: string;
  reservaLiquidezMinimaUsd: string;
  tasaBcvCongelada: string;
  creadoEn: string;
  lineas: LineaDist[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtUsd = (v: string | number) =>
  `$${Number(v).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtBs = (v: string | number) =>
  `Bs. ${Number(v).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const estadoBadge: Record<string, string> = {
  SIMULACION: 'bg-blue-900 text-blue-200',
  APROBADO: 'bg-green-900 text-green-200',
  CERRADO_INMUTABLE: 'bg-red-900 text-red-200',
  PAGADO: 'bg-yellow-900 text-yellow-200',
};

// ─── Pestaña Socios ───────────────────────────────────────────────────────────

function TabSocios({ onSelectSocio }: { onSelectSocio: (s: Socio) => void }) {
  const [data, setData] = useState<SociosResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    rif: '',
    email: '',
    telefono: '',
    porcentajeParticipacion: 0,
    banco: '',
    numeroCuenta: '',
  });

  const cargar = async () => {
    setLoading(true);
    try {
      const r = await api.get('/socios');
      setData(r.data);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async () => {
    try {
      await api.post('/socios', form);
      setShowForm(false);
      cargar();
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Error al crear socio');
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-400">Cargando socios...</div>;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <p className="text-gray-400 text-sm">Total Socios</p>
          <p className="text-3xl font-bold text-gold-400 mt-1">{data?.totalSocios ?? 0}</p>
        </div>
        <div className={`rounded-xl p-5 border ${data?.participacionCompleta ? 'bg-green-900/30 border-green-700' : 'bg-red-900/30 border-red-700'}`}>
          <p className="text-gray-400 text-sm">Suma Participación</p>
          <p className={`text-3xl font-bold mt-1 ${data?.participacionCompleta ? 'text-green-400' : 'text-red-400'}`}>
            {data?.sumaPorcentajes?.toFixed(2)}%
          </p>
          <p className="text-xs mt-1 text-gray-400">{data?.participacionCompleta ? '✓ Suma = 100%' : '⚠ Debe ser 100%'}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
          <p className="text-gray-400 text-sm">Estado Accionario</p>
          <p className={`text-lg font-bold mt-1 ${data?.participacionCompleta ? 'text-green-400' : 'text-yellow-400'}`}>
            {data?.participacionCompleta ? 'Completo' : 'Incompleto'}
          </p>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-white font-semibold">Registro de Socios Accionistas</h3>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            Nuevo Socio
          </button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-700/50">
            <tr className="text-left text-gray-400">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">RIF</th>
              <th className="px-4 py-3">Participación</th>
              <th className="px-4 py-3">Banco</th>
              <th className="px-4 py-3">Distribuciones</th>
              <th className="px-4 py-3">Portal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {(data?.socios ?? []).map((s) => (
              <tr key={s.id} className="hover:bg-gray-700/30 text-gray-300">
                <td className="px-4 py-3 font-medium text-white">{s.nombre}</td>
                <td className="px-4 py-3 font-mono">{s.rif}</td>
                <td className="px-4 py-3">
                  <span className="font-bold text-yellow-400 text-base">
                    {Number(s.porcentajeParticipacion).toFixed(2)}%
                  </span>
                </td>
                <td className="px-4 py-3">{s.banco}</td>
                <td className="px-4 py-3">{s._count.pagosDistribucion}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onSelectSocio(s)}
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" /> Ver Portal
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal nuevo socio */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 w-full max-w-lg">
            <h3 className="text-white text-xl font-bold mb-4">Registrar Nuevo Socio</h3>
            <div className="space-y-3">
              {[
                { label: 'Nombre Completo / Razón Social', key: 'nombre' },
                { label: 'RIF (J-XXXXXXXX-X)', key: 'rif' },
                { label: 'Email', key: 'email' },
                { label: 'Teléfono', key: 'telefono' },
                { label: 'Banco', key: 'banco' },
                { label: 'Número de Cuenta', key: 'numeroCuenta' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-gray-400 text-sm mb-1">{label}</label>
                  <input
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
                    value={(form as any)[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <div>
                <label className="block text-gray-400 text-sm mb-1">Porcentaje de Participación (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
                  value={form.porcentajeParticipacion}
                  onChange={(e) => setForm((f) => ({ ...f, porcentajeParticipacion: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={guardar} className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white py-2 rounded-lg font-medium transition-colors">
                Registrar Socio
              </button>
              <button onClick={() => setShowForm(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-medium transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Pestaña Distribuciones ───────────────────────────────────────────────────

function TabDistribuciones() {
  const [distribuciones, setDistribuciones] = useState<Distribucion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSimular, setShowSimular] = useState(false);
  const [seleccionada, setSeleccionada] = useState<Distribucion | null>(null);
  const [form, setForm] = useState({
    periodoNombre: '',
    anio: new Date().getFullYear(),
    mes: new Date().getMonth() + 1,
    reservaLiquidezMinimaUsd: 50000,
  });

  const cargar = async () => {
    setLoading(true);
    try {
      const r = await api.get('/socios/distribuciones');
      setDistribuciones(r.data);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const simular = async () => {
    try {
      await api.post('/socios/distribuciones/simular', form);
      setShowSimular(false);
      cargar();
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Error al simular distribución');
    }
  };

  const aprobar = async (id: string) => {
    try {
      await api.patch(`/socios/distribuciones/${id}/aprobar`);
      cargar();
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Error al aprobar');
    }
  };

  const cerrarInmutable = async (id: string) => {
    if (!confirm('⚠️ Esta acción es IRREVERSIBLE. ¿Está seguro de cerrar la distribución de forma inmutable?')) return;
    try {
      await api.patch(`/socios/distribuciones/${id}/cerrar-inmutable`);
      cargar();
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Error al cerrar');
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-400">Cargando distribuciones...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-white font-semibold text-lg">Distribuciones de Dividendos</h3>
        <button
          onClick={() => setShowSimular(true)}
          className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <TrendingUp className="w-4 h-4" />
          Nueva Simulación
        </button>
      </div>

      {distribuciones.length === 0 ? (
        <div className="text-center py-16 text-gray-500 bg-gray-800/50 rounded-xl border border-gray-700">
          No hay distribuciones registradas aún
        </div>
      ) : (
        <div className="space-y-4">
          {distribuciones.map((d) => (
            <div key={d.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="p-4 flex items-center justify-between border-b border-gray-700">
                <div>
                  <span className="font-mono text-yellow-400 font-bold">{d.correlativo}</span>
                  <span className="ml-3 text-white">{d.periodoNombre}</span>
                  <span className={`ml-3 text-xs px-2 py-1 rounded-full font-semibold ${estadoBadge[d.estado] ?? 'bg-gray-700 text-gray-300'}`}>
                    {d.estado.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex gap-2">
                  {d.estado === 'SIMULACION' && (
                    <button onClick={() => aprobar(d.id)} className="flex items-center gap-1 bg-green-700 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium">
                      <CheckCircle className="w-3.5 h-3.5" /> Aprobar
                    </button>
                  )}
                  {d.estado === 'APROBADO' && (
                    <button onClick={() => cerrarInmutable(d.id)} className="flex items-center gap-1 bg-red-700 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium">
                      <Lock className="w-3.5 h-3.5" /> Cerrar Inmutable
                    </button>
                  )}
                  <button onClick={() => setSeleccionada(seleccionada?.id === d.id ? null : d)} className="text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-lg text-xs border border-blue-700">
                    {seleccionada?.id === d.id ? 'Ocultar' : 'Ver Detalle'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 p-4 text-sm">
                <div>
                  <p className="text-gray-400">Utilidad Neta</p>
                  <p className="text-white font-semibold">{fmtUsd(d.utilidadNetaUsd)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Reserva Mínima</p>
                  <p className="text-orange-400 font-semibold">{fmtUsd(d.reservaLiquidezMinimaUsd)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Total Distribuible USD</p>
                  <p className="text-green-400 font-semibold">{fmtUsd(d.montoDistribuibleUsd)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Total Distribuible Bs.</p>
                  <p className="text-green-400 font-semibold">{fmtBs(d.montoDistribuibleBs)}</p>
                </div>
              </div>

              {seleccionada?.id === d.id && (
                <div className="border-t border-gray-700 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-700/50">
                      <tr className="text-left text-gray-400">
                        <th className="px-4 py-2">Socio</th>
                        <th className="px-4 py-2">RIF</th>
                        <th className="px-4 py-2">%</th>
                        <th className="px-4 py-2">Monto USD</th>
                        <th className="px-4 py-2">Monto Bs.</th>
                        <th className="px-4 py-2">Estado Pago</th>
                        <th className="px-4 py-2">Referencia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {d.lineas.map((l, idx) => (
                        <tr key={idx} className="text-gray-300 hover:bg-gray-700/30">
                          <td className="px-4 py-2 text-white">{l.socio.nombre}</td>
                          <td className="px-4 py-2 font-mono">{l.socio.rif}</td>
                          <td className="px-4 py-2 font-bold text-yellow-400">{Number(l.porcentaje).toFixed(2)}%</td>
                          <td className="px-4 py-2 text-green-400">{fmtUsd(l.montoUsd)}</td>
                          <td className="px-4 py-2">{fmtBs(l.montoBs)}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${l.estadoPago === 'PAGADO' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                              {l.estadoPago}
                            </span>
                          </td>
                          <td className="px-4 py-2 font-mono">{l.referenciaPago ?? '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Simular */}
      {showSimular && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 w-full max-w-md">
            <h3 className="text-white text-xl font-bold mb-1">Simular Distribución</h3>
            <p className="text-gray-400 text-sm mb-4">La reserva mínima de liquidez de <strong className="text-yellow-400">$50,000 USD</strong> se deduce automáticamente antes de repartir.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Período (Ej: Octubre 2026)</label>
                <input
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
                  value={form.periodoNombre}
                  onChange={(e) => setForm((f) => ({ ...f, periodoNombre: e.target.value }))}
                  placeholder="Nombre descriptivo del período"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Año</label>
                  <input type="number" className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" value={form.anio} onChange={(e) => setForm((f) => ({ ...f, anio: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Mes</label>
                  <input type="number" min={1} max={12} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" value={form.mes} onChange={(e) => setForm((f) => ({ ...f, mes: Number(e.target.value) }))} />
                </div>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Reserva Mínima USD (mín. $50,000)</label>
                <input type="number" min={50000} step={1000} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" value={form.reservaLiquidezMinimaUsd} onChange={(e) => setForm((f) => ({ ...f, reservaLiquidezMinimaUsd: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={simular} className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white py-2 rounded-lg font-medium">
                Generar Simulación
              </button>
              <button onClick={() => setShowSimular(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-medium">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Pestaña Portal del Socio ─────────────────────────────────────────────────

function TabPortal({ socioPreseleccionado }: { socioPreseleccionado?: Socio }) {
  const [socioId, setSocioId] = useState(socioPreseleccionado?.rif ?? '');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (socioPreseleccionado) {
      setSocioId(socioPreseleccionado.rif);
    }
  }, [socioPreseleccionado]);

  const consultar = async () => {
    if (!socioId.trim()) return;
    setLoading(true);
    try {
      const r = await api.get(`/socios/portal/${socioId}`);
      setData(r.data);
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Socio no encontrado');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <input
          className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-yellow-500"
          placeholder="RIF o ID del socio (Ej: J-123456789)"
          value={socioId}
          onChange={(e) => setSocioId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && consultar()}
        />
        <button onClick={consultar} disabled={loading} className="bg-yellow-600 hover:bg-yellow-500 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Consultar
        </button>
      </div>

      {data && (
        <div className="space-y-4">
          {/* Cabecera del socio */}
          <div className="bg-gradient-to-r from-yellow-900/40 to-gray-800 rounded-xl p-6 border border-yellow-700/40">
            <h3 className="text-yellow-400 text-2xl font-bold">{data.socio.nombre}</h3>
            <p className="text-gray-400 mt-1 font-mono">{data.socio.rif}</p>
            <div className="mt-4 grid grid-cols-3 gap-6 text-sm">
              <div>
                <p className="text-gray-400">Participación Accionaria</p>
                <p className="text-3xl font-bold text-yellow-400 mt-1">{Number(data.socio.porcentajeParticipacion).toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-gray-400">Total Cobrado</p>
                <p className="text-2xl font-bold text-green-400 mt-1">{fmtUsd(data.metricas.totalCobradoUsd)}</p>
              </div>
              <div>
                <p className="text-gray-400">Total Pendiente</p>
                <p className="text-2xl font-bold text-orange-400 mt-1">{fmtUsd(data.metricas.totalPendienteUsd)}</p>
              </div>
            </div>
          </div>

          {/* Histórico */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h4 className="text-white font-semibold">Histórico de Distribuciones</h4>
            </div>
            {data.historico.length === 0 ? (
              <p className="text-center py-8 text-gray-500">Sin distribuciones registradas</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-700/50">
                  <tr className="text-left text-gray-400">
                    <th className="px-4 py-3">Período</th>
                    <th className="px-4 py-3">Mi Monto USD</th>
                    <th className="px-4 py-3">Mi Monto Bs.</th>
                    <th className="px-4 py-3">Tasa BCV</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Referencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {data.historico.map((h: any, idx: number) => (
                    <tr key={idx} className="text-gray-300 hover:bg-gray-700/30">
                      <td className="px-4 py-3 font-medium text-white">{h.periodoNombre}</td>
                      <td className="px-4 py-3 text-green-400 font-bold">{fmtUsd(h.miMontoUsd)}</td>
                      <td className="px-4 py-3">{fmtBs(h.miMontoBs)}</td>
                      <td className="px-4 py-3 text-yellow-400">{Number(h.tasaBcv).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${h.estadoPago === 'PAGADO' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
                          {h.estadoPago}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{h.referenciaPago ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────

export default function SociosPage() {
  const [tab, setTab] = useState<'socios' | 'distribuciones' | 'portal'>('socios');
  const [socioSeleccionado, setSocioSeleccionado] = useState<Socio | undefined>();

  const abrirPortal = (socio: Socio) => {
    setSocioSeleccionado(socio);
    setTab('portal');
  };

  const tabs = [
    { key: 'socios', label: 'Socios Accionistas', icon: Users },
    { key: 'distribuciones', label: 'Distribuciones de Dividendos', icon: TrendingUp },
    { key: 'portal', label: 'Portal del Socio', icon: Eye },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-yellow-600/20 rounded-xl border border-yellow-600/30">
          <DollarSign className="w-7 h-7 text-yellow-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Socios e Inversores</h1>
          <p className="text-gray-400 text-sm">Gestión accionaria, distribución de dividendos y portal del socio</p>
        </div>
      </div>

      {/* Pestañas */}
      <div className="flex gap-1 bg-gray-800/60 rounded-xl p-1 border border-gray-700">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as typeof tab)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
              tab === key
                ? 'bg-yellow-600 text-white shadow'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {tab === 'socios' && <TabSocios onSelectSocio={abrirPortal} />}
      {tab === 'distribuciones' && <TabDistribuciones />}
      {tab === 'portal' && <TabPortal socioPreseleccionado={socioSeleccionado} />}
    </div>
  );
}
