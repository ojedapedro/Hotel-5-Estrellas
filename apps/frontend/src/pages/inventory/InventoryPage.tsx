import React, { useEffect, useState } from 'react';
import { api } from '../../lib/axios';
import { formatUsd } from '../../lib/utils';
import {
  Boxes,
  Plus,
  AlertTriangle,
  ArrowRightLeft,
  Search,
  X,
  Warehouse,
} from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [stock, setStock] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [articuloId, setArticuloId] = useState('');
  const [almacenDestinoId, setAlmacenDestinoId] = useState('');
  const [tipo, setTipo] = useState('ENTRADA_COMPRA');
  const [cantidad, setCantidad] = useState('10');
  const [costoUnitario, setCostoUnitario] = useState('5.00');
  const [referencia, setReferencia] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [whRes, stockRes, alertsRes] = await Promise.all([
        api.get('/inventory/warehouses'),
        api.get(selectedWarehouse !== 'ALL' ? `/inventory/stock?almacenId=${selectedWarehouse}` : '/inventory/stock'),
        api.get('/inventory/alerts'),
      ]);

      if (whRes.data?.data) setWarehouses(whRes.data.data);
      if (stockRes.data?.data) setStock(stockRes.data.data);
      if (alertsRes.data?.data) setAlerts(alertsRes.data.data);
    } catch (err) {
      console.error('Error al cargar inventario', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedWarehouse]);

  const handleRegisterMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/inventory/movements', {
        articuloId,
        almacenDestinoId: almacenDestinoId || undefined,
        tipo,
        cantidad: Number(cantidad),
        costoUnitarioUsd: Number(costoUnitario),
        referenciaDocumento: referencia || undefined,
      });

      alert('Movimiento registrado y costo promedio actualizado en Kardex');
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al registrar movimiento');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-gold-400 uppercase tracking-widest">
            Control de Abastecimiento
          </span>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight mt-1 flex items-center gap-3">
            <Boxes className="w-7 h-7 text-gold-400" />
            Inventarios (5 Almacenes)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Kardex valorizado al costo promedio ponderado y alertas de stock mínimo
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-gold-500/20 flex items-center gap-2 text-xs"
        >
          <Plus className="w-4 h-4" /> Registrar Movimiento
        </button>
      </div>

      {/* Los 5 Almacenes Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {warehouses.map((wh) => (
          <div
            key={wh.id}
            onClick={() => setSelectedWarehouse(selectedWarehouse === wh.id ? 'ALL' : wh.id)}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              selectedWarehouse === wh.id
                ? 'bg-gold-500/10 border-gold-500 shadow-md shadow-gold-500/10'
                : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Warehouse
                className={`w-5 h-5 ${
                  selectedWarehouse === wh.id ? 'text-gold-400' : 'text-slate-500'
                }`}
              />
              <span className="text-[10px] font-bold text-slate-500">
                {wh._count?.existencias || 0} ítems
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-200 truncate">
              {wh.nombre}
            </h3>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {wh.departamento}
            </p>
          </div>
        ))}
      </div>

      {/* Tabla de Existencias */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-100 uppercase tracking-wider">
            Existencias en Almacén
          </h2>
          {selectedWarehouse !== 'ALL' && (
            <button
              onClick={() => setSelectedWarehouse('ALL')}
              className="text-xs text-gold-400 hover:underline font-semibold"
            >
              Ver todos los almacenes
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-6">Código / Artículo</th>
                <th className="py-3.5 px-6">Almacén</th>
                <th className="py-3.5 px-6 text-right">Cantidad</th>
                <th className="py-3.5 px-6 text-right">Stock Mínimo</th>
                <th className="py-3.5 px-6 text-right">Costo Promedio ($)</th>
                <th className="py-3.5 px-6 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500">
                    Cargando existencias...
                  </td>
                </tr>
              ) : stock.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500">
                    No hay existencias registradas en este almacén
                  </td>
                </tr>
              ) : (
                stock.map((e) => {
                  const cant = Number(e.cantidad);
                  const min = Number(e.articulo?.stockMinimo || 0);
                  const isLow = cant <= min;

                  return (
                    <tr key={e.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-6 font-semibold text-slate-100">
                        {e.articulo?.nombre}
                        <span className="block text-[10px] font-mono text-gold-400">
                          {e.articulo?.codigo}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-slate-400">
                        {e.almacen?.nombre}
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono font-bold text-slate-100">
                        {cant} {e.articulo?.unidadMedida}
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono text-slate-500">
                        {min} {e.articulo?.unidadMedida}
                      </td>
                      <td className="py-3.5 px-6 text-right font-mono text-slate-300">
                        {formatUsd(Number(e.costoPromedioUsd))}
                      </td>
                      <td className="py-3.5 px-6 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            isLow
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {isLow ? 'Bajo Stock' : 'Normal'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Registrar Movimiento */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-100 p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-black text-slate-100 mb-1">
              Registrar Movimiento de Inventario
            </h2>
            <p className="text-xs text-slate-400 mb-5">
              Entrada, salida o ajuste con cálculo ponderado
            </p>

            <form onSubmit={handleRegisterMovement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Tipo de Movimiento
                </label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-500 cursor-pointer"
                >
                  <option value="ENTRADA_COMPRA">Entrada por Compra (Proveedor)</option>
                  <option value="SALIDA_CONSUMO">Salida por Consumo Interno</option>
                  <option value="AJUSTE_POSITIVO">Ajuste de Inventario (+)</option>
                  <option value="AJUSTE_NEGATIVO">Ajuste de Inventario (-)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Almacén Destino
                </label>
                <select
                  required
                  value={almacenDestinoId}
                  onChange={(e) => setAlmacenDestinoId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-500 cursor-pointer"
                >
                  <option value="">Seleccione almacén</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Costo Unitario ($ USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={costoUnitario}
                    onChange={(e) => setCostoUnitario(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Referencia / N° Factura Proveedor
                </label>
                <input
                  type="text"
                  placeholder="Ej. FC-2026-987"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-slate-950 font-bold py-2.5 rounded-xl transition-all text-xs disabled:opacity-50 mt-2"
              >
                {submitting ? 'Guardando...' : 'Confirmar Movimiento'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
