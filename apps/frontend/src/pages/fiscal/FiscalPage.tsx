import { useState, useEffect } from 'react';
import api from '../../lib/axios';
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtBs = (v: number) =>
  `Bs. ${v.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtUsd = (v: number) =>
  `$${v.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// ─── Selector de Período ──────────────────────────────────────────────────────

function SelectorPeriodo({
  anio, mes, onChange,
}: {
  anio: number;
  mes: number;
  onChange: (a: number, m: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <select
        className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
        value={mes}
        onChange={(e) => onChange(anio, Number(e.target.value))}
      >
        {MESES.map((m, i) => (
          <option key={i + 1} value={i + 1}>{m}</option>
        ))}
      </select>
      <select
        className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
        value={anio}
        onChange={(e) => onChange(Number(e.target.value), mes)}
      >
        {[2024, 2025, 2026, 2027].map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Tab Libro de Ventas ──────────────────────────────────────────────────────

function TabLibroVentas() {
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/fiscal/libro-ventas?anio=${anio}&mes=${mes}`);
      setData(r.data);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, [anio, mes]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <SelectorPeriodo anio={anio} mes={mes} onChange={(a, m) => { setAnio(a); setMes(m); }} />
        <button onClick={cargar} disabled={loading} className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 text-sm border border-yellow-700/40 px-3 py-2 rounded-lg">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {data && (
        <>
          {/* Totales */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Total Ventas Bs.', valor: data.totales.totalVentasBs, color: 'text-white' },
              { label: 'Base Imponible Bs.', valor: data.totales.baseImponibleBs, color: 'text-blue-400' },
              { label: 'IVA Débito Fiscal Bs.', valor: data.totales.ivaDebitoBs, color: 'text-yellow-400' },
              { label: 'IGTF Bs. (3%)', valor: data.totales.igtfBs, color: 'text-orange-400' },
            ].map(({ label, valor, color }) => (
              <div key={label} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <p className="text-gray-400 text-xs">{label}</p>
                <p className={`text-lg font-bold mt-1 ${color}`}>{fmtBs(valor)}</p>
              </div>
            ))}
          </div>

          {/* Tabla */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-x-auto">
            <div className="px-4 py-3 border-b border-gray-700">
              <span className="text-white font-semibold">Libro de Ventas SENIAT — {data.periodo}</span>
              <span className="ml-3 text-gray-400 text-sm">({data.totalDocumentos} documentos)</span>
            </div>
            <table className="w-full text-xs">
              <thead className="bg-gray-700/50">
                <tr className="text-left text-gray-400">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">RIF Cliente</th>
                  <th className="px-3 py-2">Cliente</th>
                  <th className="px-3 py-2">N° Factura</th>
                  <th className="px-3 py-2">N° Control</th>
                  <th className="px-3 py-2">Total Bs.</th>
                  <th className="px-3 py-2">Exento Bs.</th>
                  <th className="px-3 py-2">Base Imp. Bs.</th>
                  <th className="px-3 py-2">Alíc. IVA</th>
                  <th className="px-3 py-2">IVA Bs.</th>
                  <th className="px-3 py-2">IGTF Bs.</th>
                  <th className="px-3 py-2">Tasa BCV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {(data.filas ?? []).map((f: any) => (
                  <tr key={f.operacion} className="text-gray-300 hover:bg-gray-700/30">
                    <td className="px-3 py-2">{f.operacion}</td>
                    <td className="px-3 py-2">{new Date(f.fecha).toLocaleDateString('es-VE')}</td>
                    <td className="px-3 py-2 font-mono">{f.rif}</td>
                    <td className="px-3 py-2 max-w-[120px] truncate">{f.nombre}</td>
                    <td className="px-3 py-2 font-mono text-yellow-400">{f.numeroFactura}</td>
                    <td className="px-3 py-2 font-mono">{f.numeroControl}</td>
                    <td className="px-3 py-2 font-semibold text-white">{fmtBs(Number(f.totalVentasBs))}</td>
                    <td className="px-3 py-2">{fmtBs(Number(f.ventasExentasBs))}</td>
                    <td className="px-3 py-2">{fmtBs(Number(f.baseImponibleBs))}</td>
                    <td className="px-3 py-2">{Number(f.alicuotaIva)}%</td>
                    <td className="px-3 py-2 text-yellow-400">{fmtBs(Number(f.impuestoIvaBs))}</td>
                    <td className="px-3 py-2 text-orange-400">{fmtBs(Number(f.igtfBs))}</td>
                    <td className="px-3 py-2 text-blue-400">{Number(f.tasaBcv).toFixed(2)}</td>
                  </tr>
                ))}
                {(data.filas ?? []).length === 0 && (
                  <tr>
                    <td colSpan={13} className="text-center py-8 text-gray-500">
                      Sin documentos en el período {data.periodo}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tab Libro de Compras ─────────────────────────────────────────────────────

function TabLibroCompras() {
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/fiscal/libro-compras?anio=${anio}&mes=${mes}`);
      setData(r.data);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, [anio, mes]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <SelectorPeriodo anio={anio} mes={mes} onChange={(a, m) => { setAnio(a); setMes(m); }} />
        <button onClick={cargar} disabled={loading} className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 text-sm border border-yellow-700/40 px-3 py-2 rounded-lg">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {data && (
        <>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Compras Bs.', valor: data.totales.totalComprasBs, color: 'text-white' },
              { label: 'Base Imponible Bs.', valor: data.totales.baseImponibleBs, color: 'text-blue-400' },
              { label: 'IVA Crédito Fiscal Bs.', valor: data.totales.ivaCreditoBs, color: 'text-green-400' },
            ].map(({ label, valor, color }) => (
              <div key={label} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <p className="text-gray-400 text-xs">{label}</p>
                <p className={`text-lg font-bold mt-1 ${color}`}>{fmtBs(valor)}</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-x-auto">
            <div className="px-4 py-3 border-b border-gray-700">
              <span className="text-white font-semibold">Libro de Compras SENIAT — {data.periodo}</span>
              <span className="ml-3 text-gray-400 text-sm">({data.totalDocumentos} documentos)</span>
            </div>
            <table className="w-full text-xs">
              <thead className="bg-gray-700/50">
                <tr className="text-left text-gray-400">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">RIF Proveedor</th>
                  <th className="px-3 py-2">Proveedor</th>
                  <th className="px-3 py-2">N° Orden</th>
                  <th className="px-3 py-2">Base Imp. Bs.</th>
                  <th className="px-3 py-2">IVA Crédito Bs.</th>
                  <th className="px-3 py-2">Total Bs.</th>
                  <th className="px-3 py-2">Tasa BCV</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {(data.filas ?? []).map((f: any) => (
                  <tr key={f.operacion} className="text-gray-300 hover:bg-gray-700/30">
                    <td className="px-3 py-2">{f.operacion}</td>
                    <td className="px-3 py-2">{new Date(f.fecha).toLocaleDateString('es-VE')}</td>
                    <td className="px-3 py-2 font-mono">{f.rif}</td>
                    <td className="px-3 py-2 max-w-[150px] truncate">{f.proveedor}</td>
                    <td className="px-3 py-2 font-mono text-yellow-400">{f.numeroOrden}</td>
                    <td className="px-3 py-2">{fmtBs(Number(f.baseImponibleBs))}</td>
                    <td className="px-3 py-2 text-green-400">{fmtBs(Number(f.ivaCreditoBs))}</td>
                    <td className="px-3 py-2 font-semibold text-white">{fmtBs(Number(f.totalBs))}</td>
                    <td className="px-3 py-2 text-blue-400">{Number(f.tasaBcv).toFixed(2)}</td>
                  </tr>
                ))}
                {(data.filas ?? []).length === 0 && (
                  <tr><td colSpan={9} className="text-center py-8 text-gray-500">Sin documentos en el período</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tab Retenciones ──────────────────────────────────────────────────────────

function TabRetenciones() {
  const [periodoFiscal, setPeriodoFiscal] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    tipoRetencion: 'IVA',
    periodoFiscal: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    proveedorNombre: '',
    proveedorRif: '',
    numeroFacturaAfectada: '',
    numeroControlFactura: '',
    totalFacturaBs: 0,
    baseImponibleBs: 0,
    ivaTotalBs: 0,
    porcentajeRetenido: 75,
  });

  const cargar = async () => {
    setLoading(true);
    try {
      const url = periodoFiscal ? `/fiscal/retenciones?periodoFiscal=${periodoFiscal}` : '/fiscal/retenciones';
      const r = await api.get(url);
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
      await api.post('/fiscal/retenciones', form);
      setShowForm(false);
      cargar();
    } catch (e: any) {
      alert(e.response?.data?.message ?? 'Error al generar comprobante');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <input
          className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
          placeholder="Período Fiscal (YYYY-MM)"
          value={periodoFiscal}
          onChange={(e) => setPeriodoFiscal(e.target.value)}
        />
        <button onClick={cargar} disabled={loading} className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 text-sm border border-yellow-700/40 px-3 py-2 rounded-lg">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Filtrar
        </button>
        <div className="flex-1" />
        <button onClick={() => setShowForm(true)} className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
          + Generar Comprobante
        </button>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-gray-700/50">
            <tr className="text-left text-gray-400">
              <th className="px-3 py-2">N° Comprobante</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Período</th>
              <th className="px-3 py-2">Proveedor</th>
              <th className="px-3 py-2">RIF</th>
              <th className="px-3 py-2">N° Factura</th>
              <th className="px-3 py-2">Total Factura Bs.</th>
              <th className="px-3 py-2">% Retenido</th>
              <th className="px-3 py-2">Monto Retenido Bs.</th>
              <th className="px-3 py-2">Tasa BCV</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {data.map((c: any) => (
              <tr key={c.id} className="text-gray-300 hover:bg-gray-700/30">
                <td className="px-3 py-2 font-mono text-yellow-400">{c.numeroComprobante}</td>
                <td className="px-3 py-2">
                  <span className="bg-blue-900 text-blue-200 px-2 py-0.5 rounded-full text-xs font-semibold">{c.tipoRetencion}</span>
                </td>
                <td className="px-3 py-2">{c.periodoFiscal}</td>
                <td className="px-3 py-2 max-w-[130px] truncate">{c.proveedorNombre}</td>
                <td className="px-3 py-2 font-mono">{c.proveedorRif}</td>
                <td className="px-3 py-2 font-mono">{c.numeroFacturaAfectada}</td>
                <td className="px-3 py-2">{fmtBs(Number(c.totalFacturaBs))}</td>
                <td className="px-3 py-2 font-bold text-orange-400">{Number(c.porcentajeRetenido)}%</td>
                <td className="px-3 py-2 font-bold text-red-400">{fmtBs(Number(c.montoRetenidoBs))}</td>
                <td className="px-3 py-2 text-blue-400">{Number(c.tasaBcvCongelada).toFixed(2)}</td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan={10} className="text-center py-8 text-gray-500">Sin comprobantes de retención registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal nuevo comprobante */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-white text-xl font-bold mb-4">Generar Comprobante de Retención</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Tipo de Retención</label>
                <select className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" value={form.tipoRetencion} onChange={(e) => setForm((f) => ({ ...f, tipoRetencion: e.target.value }))}>
                  <option value="IVA">IVA</option>
                  <option value="ISLR">ISLR</option>
                </select>
              </div>
              {[
                { label: 'Período Fiscal (YYYY-MM)', key: 'periodoFiscal' },
                { label: 'Nombre del Proveedor', key: 'proveedorNombre' },
                { label: 'RIF del Proveedor', key: 'proveedorRif' },
                { label: 'N° de Factura Afectada', key: 'numeroFacturaAfectada' },
                { label: 'N° Control de Factura', key: 'numeroControlFactura' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-gray-400 text-sm mb-1">{label}</label>
                  <input className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" value={(form as any)[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
              {[
                { label: 'Total Factura Bs.', key: 'totalFacturaBs' },
                { label: 'Base Imponible Bs.', key: 'baseImponibleBs' },
                { label: 'IVA Total Bs.', key: 'ivaTotalBs' },
                { label: 'Porcentaje Retenido (%)', key: 'porcentajeRetenido' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-gray-400 text-sm mb-1">{label}</label>
                  <input type="number" min={0} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm" value={(form as any)[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: Number(e.target.value) }))} />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={guardar} className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white py-2 rounded-lg font-medium">Generar</button>
              <button onClick={() => setShowForm(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-medium">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab Calendario Fiscal ────────────────────────────────────────────────────

function TabCalendario() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/fiscal/calendario').then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  const estadoIcon: Record<string, React.ReactNode> = {
    VIGENTE: <CheckCircle className="w-5 h-5 text-green-400" />,
    PROXIMO: <Clock className="w-5 h-5 text-yellow-400" />,
    VENCIDO: <AlertTriangle className="w-5 h-5 text-red-400" />,
  };

  if (loading) return <div className="text-center py-16 text-gray-400">Cargando calendario...</div>;

  return (
    <div className="space-y-4">
      <p className="text-gray-400 text-sm">
        Obligaciones fiscales SENIAT — Contribuyentes Especiales. Mes en curso.
      </p>
      <div className="grid gap-4">
        {data.map((item: any, idx: number) => (
          <div key={idx} className="bg-gray-800 rounded-xl border border-gray-700 p-5 flex items-start gap-4">
            <div className="mt-0.5">{estadoIcon[item.estado] ?? <Clock className="w-5 h-5 text-gray-400" />}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-white font-semibold">{item.obligacion}</h4>
                <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded-full">{item.frecuencia}</span>
              </div>
              <p className="text-gray-400 text-sm mt-1">{item.descripcion}</p>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span className="text-gray-500">Período: <span className="text-gray-300">{item.periodo}</span></span>
                <span className="text-gray-500">Vence: <span className="text-red-400 font-semibold">{item.fechaVencimiento}</span></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab Resumen Fiscal ───────────────────────────────────────────────────────

function TabResumen() {
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const cargar = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/fiscal/resumen?anio=${anio}&mes=${mes}`);
      setData(r.data);
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, [anio, mes]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <SelectorPeriodo anio={anio} mes={mes} onChange={(a, m) => { setAnio(a); setMes(m); }} />
        <button onClick={cargar} disabled={loading} className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 text-sm border border-yellow-700/40 px-3 py-2 rounded-lg">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Recalcular
        </button>
      </div>

      {data && (
        <div className="space-y-5">
          {/* Tasa BCV referencia */}
          <div className="bg-blue-900/20 border border-blue-700/40 rounded-xl p-4 flex items-center gap-3">
            <BarChart2 className="w-5 h-5 text-blue-400" />
            <span className="text-blue-300 text-sm">
              Tasa BCV de referencia: <strong className="text-white">{Number(data.tasaBcvReferencia).toFixed(2)} Bs./USD</strong> — Período {data.periodo}
            </span>
          </div>

          {/* IVA */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <h4 className="text-gray-400 text-sm font-medium mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> IVA — Determinación
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-400">Débito Fiscal (ventas)</span>
                  <span className="text-yellow-400 font-bold">{fmtBs(data.debitoFiscalBs)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-400">Crédito Fiscal (compras)</span>
                  <span className="text-green-400 font-bold">({fmtBs(data.creditoFiscalBs)})</span>
                </div>
                <div className="flex justify-between items-center py-2 bg-gray-700/40 rounded-lg px-3">
                  <span className="text-white font-semibold">IVA NETO A ENTERAR</span>
                  <div className="text-right">
                    <p className="text-red-400 font-bold text-lg">{fmtBs(data.ivaNetoPorPagarBs)}</p>
                    <p className="text-gray-400 text-xs">{fmtUsd(data.ivaNetoPorPagarUsd)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
              <h4 className="text-gray-400 text-sm font-medium mb-4 flex items-center gap-2">
                <TrendingDown className="w-4 h-4" /> IGTF (3% sobre divisas)
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-700">
                  <span className="text-gray-400">Total ventas en divisas</span>
                  <span className="text-white font-bold">{fmtBs(data.totalVentasBs)}</span>
                </div>
                <div className="flex justify-between items-center py-2 bg-gray-700/40 rounded-lg px-3">
                  <span className="text-white font-semibold">IGTF A ENTERAR</span>
                  <div className="text-right">
                    <p className="text-orange-400 font-bold text-lg">{fmtBs(data.igtfPorPagarBs)}</p>
                    <p className="text-gray-400 text-xs">{fmtUsd(data.igtfPorPagarUsd)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Volumen total */}
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <h4 className="text-gray-400 text-sm mb-3">Volumen del Período</h4>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-gray-400 text-sm">Total Ventas del Período</p>
                <p className="text-2xl font-bold text-green-400 mt-1">{fmtBs(data.totalVentasBs)}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Compras del Período</p>
                <p className="text-2xl font-bold text-red-400 mt-1">{fmtBs(data.totalComprasBs)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Página Principal ─────────────────────────────────────────────────────────

export default function FiscalPage() {
  const [tab, setTab] = useState<'ventas' | 'compras' | 'retenciones' | 'calendario' | 'resumen'>('resumen');

  const tabs = [
    { key: 'resumen', label: 'Resumen Fiscal', icon: BarChart2 },
    { key: 'ventas', label: 'Libro de Ventas', icon: TrendingUp },
    { key: 'compras', label: 'Libro de Compras', icon: TrendingDown },
    { key: 'retenciones', label: 'Retenciones', icon: FileText },
    { key: 'calendario', label: 'Calendario SENIAT', icon: Calendar },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-green-700/20 rounded-xl border border-green-700/30">
          <FileText className="w-7 h-7 text-green-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Fiscal y SENIAT</h1>
          <p className="text-gray-400 text-sm">
            IVA 16% · IGTF 3% · Retenciones · Libros oficiales SENIAT · Contribuyente Especial
          </p>
        </div>
      </div>

      {/* Aviso regulatorio */}
      <div className="bg-orange-900/20 border border-orange-700/40 rounded-xl p-3 flex items-center gap-3 text-sm">
        <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0" />
        <p className="text-orange-200">
          <strong>IGTF 3%</strong> se aplica obligatoriamente sobre todos los pagos recibidos en USD, Zelle, Binance, tarjetas internacionales y divisas físicas.
          Exonerado en pagos Bs. en efectivo, transferencia bancaria venezolana y débito nacional.
        </p>
      </div>

      {/* Pestañas */}
      <div className="flex gap-1 bg-gray-800/60 rounded-xl p-1 border border-gray-700 overflow-x-auto">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as typeof tab)}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              tab === key
                ? 'bg-green-700 text-white shadow'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {tab === 'resumen' && <TabResumen />}
      {tab === 'ventas' && <TabLibroVentas />}
      {tab === 'compras' && <TabLibroCompras />}
      {tab === 'retenciones' && <TabRetenciones />}
      {tab === 'calendario' && <TabCalendario />}
    </div>
  );
}
