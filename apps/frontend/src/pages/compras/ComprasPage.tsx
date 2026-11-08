import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import {
  ShoppingCart, Package, CheckCircle, Clock, AlertCircle,
  Plus, Eye, TruckIcon, X
} from 'lucide-react';

interface Proveedor {
  id: string; nombre: string; rif: string; email?: string; telefono?: string;
}
interface OrdenCompra {
  id: string; correlativo: string; estado: string; totalUsd: number; totalBs: number;
  proveedor: { nombre: string; rif: string };
  almacenDestino: { nombre: string };
  creadoPor: { nombre: string };
  creadoEn: string;
  _count: { items: number };
}

const ESTADO_COLORS: Record<string, string> = {
  BORRADOR: 'text-gray-400 bg-gray-800',
  APROBADA: 'text-blue-400 bg-blue-900/40',
  ENVIADA: 'text-yellow-400 bg-yellow-900/40',
  RECIBIDA_PARCIAL: 'text-orange-400 bg-orange-900/40',
  RECIBIDA_TOTAL: 'text-green-400 bg-green-900/40',
  CANCELADA: 'text-red-400 bg-red-900/40',
};

export default function ComprasPage() {
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'ordenes' | 'proveedores'>('ordenes');
  const [showNewProveedor, setShowNewProveedor] = useState(false);
  const [filterEstado, setFilterEstado] = useState('');

  // Form proveedor
  const [pvForm, setPvForm] = useState({ nombre: '', rif: '', email: '', telefono: '', direccion: '' });

  useEffect(() => {
    fetchData();
  }, [filterEstado]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordRes, pvRes] = await Promise.all([
        api.get('/compras/ordenes', { params: filterEstado ? { estado: filterEstado } : {} }),
        api.get('/compras/proveedores'),
      ]);
      setOrdenes(ordRes.data);
      setProveedores(pvRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const aprobarOrden = async (id: string) => {
    if (!confirm('¿Aprobar esta orden de compra?')) return;
    try {
      await api.patch(`/compras/ordenes/${id}/aprobar`, {});
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Error al aprobar');
    }
  };

  const saveProveedor = async () => {
    try {
      await api.post('/compras/proveedores', pvForm);
      setShowNewProveedor(false);
      setPvForm({ nombre: '', rif: '', email: '', telefono: '', direccion: '' });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Error al guardar');
    }
  };

  // KPIs
  const totalOrdenes = ordenes.length;
  const pendientesAprobacion = ordenes.filter(o => o.estado === 'BORRADOR').length;
  const totalUsd = ordenes.filter(o => !['CANCELADA'].includes(o.estado))
    .reduce((s, o) => s + o.totalUsd, 0);
  const recibidas = ordenes.filter(o => o.estado === 'RECIBIDA_TOTAL').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gold-400">Compras y Proveedores</h1>
          <p className="text-gray-400 text-sm mt-1">Gestión de órdenes de compra y proveedores</p>
        </div>
        <button
          onClick={() => setShowNewProveedor(true)}
          className="flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-black px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
        >
          <Plus size={16} />
          Nuevo Proveedor
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Órdenes', value: totalOrdenes, icon: ShoppingCart, color: 'text-blue-400' },
          { label: 'Pendientes Aprobación', value: pendientesAprobacion, icon: Clock, color: 'text-yellow-400' },
          { label: 'Recibidas', value: recibidas, icon: CheckCircle, color: 'text-green-400' },
          { label: 'Total Comprometido', value: `$${totalUsd.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`, icon: Package, color: 'text-gold-400' },
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

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-lg p-1 w-fit">
        {(['ordenes', 'proveedores'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
              tab === t ? 'bg-gold-500 text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t === 'ordenes' ? 'Órdenes de Compra' : 'Proveedores'}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'ordenes' && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          {/* Filter */}
          <div className="p-4 border-b border-gray-700 flex gap-3">
            <select
              value={filterEstado}
              onChange={e => setFilterEstado(e.target.value)}
              className="bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm"
            >
              <option value="">Todos los estados</option>
              {Object.keys(ESTADO_COLORS).map(e => (
                <option key={e} value={e}>{e.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 text-gray-400">
                <tr>
                  {['Correlativo', 'Proveedor', 'Almacén', 'Ítems', 'Total USD', 'Estado', 'Creado por', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-8 text-gray-400">Cargando...</td></tr>
                ) : ordenes.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-8 text-gray-400">No hay órdenes de compra</td></tr>
                ) : ordenes.map(o => (
                  <tr key={o.id} className="hover:bg-gray-750 transition-colors">
                    <td className="px-4 py-3 font-mono text-gold-400">{o.correlativo}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{o.proveedor.nombre}</div>
                      <div className="text-gray-400 text-xs">{o.proveedor.rif}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{o.almacenDestino.nombre}</td>
                    <td className="px-4 py-3 text-center text-gray-300">{o._count.items}</td>
                    <td className="px-4 py-3 font-semibold text-white">
                      ${Number(o.totalUsd).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${ESTADO_COLORS[o.estado] ?? 'text-gray-400'}`}>
                        {o.estado.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{o.creadoPor.nombre}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="text-blue-400 hover:text-blue-300">
                          <Eye size={16} />
                        </button>
                        {o.estado === 'BORRADOR' && (
                          <button
                            onClick={() => aprobarOrden(o.id)}
                            className="text-green-400 hover:text-green-300"
                            title="Aprobar"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        {o.estado === 'APROBADA' && (
                          <button className="text-orange-400 hover:text-orange-300" title="Registrar recepción">
                            <TruckIcon size={16} />
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

      {tab === 'proveedores' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <p className="col-span-3 text-center text-gray-400">Cargando...</p>
          ) : proveedores.map(pv => (
            <div key={pv.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white">{pv.nombre}</h3>
                  <p className="text-gray-400 text-xs font-mono">{pv.rif}</p>
                </div>
                <span className="w-2 h-2 rounded-full bg-green-400 mt-1.5" />
              </div>
              {pv.email && <p className="text-gray-400 text-sm">{pv.email}</p>}
              {pv.telefono && <p className="text-gray-400 text-sm">{pv.telefono}</p>}
            </div>
          ))}
        </div>
      )}

      {/* New Proveedor Modal */}
      {showNewProveedor && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gold-400">Nuevo Proveedor</h2>
              <button onClick={() => setShowNewProveedor(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Nombre *', key: 'nombre', placeholder: 'Nombre del proveedor' },
                { label: 'RIF *', key: 'rif', placeholder: 'J-00000000-0' },
                { label: 'Email', key: 'email', placeholder: 'email@proveedor.com' },
                { label: 'Teléfono', key: 'telefono', placeholder: '+58 212 000 0000' },
                { label: 'Dirección', key: 'direccion', placeholder: 'Dirección fiscal' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs text-gray-400 mb-1">{label}</label>
                  <input
                    value={(pvForm as any)[key]}
                    onChange={e => setPvForm(prev => ({ ...prev, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowNewProveedor(false)}
                className="flex-1 py-2 border border-gray-600 text-gray-300 rounded-lg text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={saveProveedor}
                className="flex-1 py-2 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg text-sm"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
