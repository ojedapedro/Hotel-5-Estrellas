import React, { useEffect, useState } from 'react';
import { api } from '../../lib/axios';
import { useHotelStore } from '../../stores/hotel.store';
import { formatUsd, formatBs } from '../../lib/utils';
import {
  UtensilsCrossed,
  Plus,
  Minus,
  Trash2,
  Send,
  CreditCard,
  X,
  BedDouble,
  Search,
} from 'lucide-react';

export const POSPage: React.FC = () => {
  const { tasaBcv } = useHotelStore();
  const [pointsOfSale, setPointsOfSale] = useState<any[]>([]);
  const [menu, setMenu] = useState<any[]>([]);
  const [selectedMesa, setSelectedMesa] = useState<any>(null);
  const [cart, setCart] = useState<{ producto: any; cantidad: number }[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [folios, setFolios] = useState<any[]>([]);

  // Checkout modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [payMethod, setPayMethod] = useState('EFECTIVO_USD');
  const [chargeToFolioId, setChargeToFolioId] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);

  useEffect(() => {
    // Cargar puntos de venta y mesas
    api.get('/pos/points-of-sale')
      .then((res) => {
        if (res.data?.data) {
          setPointsOfSale(res.data.data);
          if (res.data.data[0]?.mesas?.[0]) {
            setSelectedMesa(res.data.data[0].mesas[0]);
          }
        }
      })
      .catch(() => {});

    // Cargar menú
    api.get('/pos/menu')
      .then((res) => {
        if (res.data?.data) setMenu(res.data.data);
      })
      .catch(() => {});

    // Cargar folios activos para cargo a habitación
    api.get('/pms/rooms?estado=OCUPADA')
      .then((res) => {
        if (res.data?.data) setFolios(res.data.data);
      })
      .catch(() => {});
  }, []);

  const addToCart = (producto: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.producto.id === producto.id);
      if (existing) {
        return prev.map((i) =>
          i.producto.id === producto.id
            ? { ...i, cantidad: i.cantidad + 1 }
            : i,
        );
      }
      return [...prev, { producto, cantidad: 1 }];
    });
  };

  const removeFromCart = (productoId: string) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.producto.id === productoId
            ? { ...i, cantidad: i.cantidad - 1 }
            : i,
        )
        .filter((i) => i.cantidad > 0),
    );
  };

  const clearCart = () => setCart([]);

  // Cálculos
  const subtotalUsd = cart.reduce(
    (acc, item) => acc + Number(item.producto.precioUsd) * item.cantidad,
    0,
  );
  const ivaUsd = subtotalUsd * 0.16;
  const totalUsd = subtotalUsd + ivaUsd;
  const totalBs = totalUsd * tasaBcv;

  const handleSendToKitchen = async () => {
    if (cart.length === 0) return;
    setSubmittingOrder(true);
    try {
      const pvId = pointsOfSale[0]?.id || 'uuid-pv';
      const res = await api.post('/pos/comandas', {
        puntoVentaId: pvId,
        mesaId: selectedMesa?.id,
        items: cart.map((i) => ({
          productoId: i.producto.id,
          cantidad: i.cantidad,
        })),
      });

      const comandaId = res.data?.data?.id;
      if (comandaId) {
        await api.post(`/pos/comandas/${comandaId}/send-to-kitchen`);
        alert('¡Comanda enviada a Cocina por WebSocket en tiempo real!');
        clearCart();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al enviar a cocina');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleCheckoutAndPay = async () => {
    if (cart.length === 0) return;
    setSubmittingOrder(true);
    try {
      const pvId = pointsOfSale[0]?.id || 'uuid-pv';
      const comandaRes = await api.post('/pos/comandas', {
        puntoVentaId: pvId,
        mesaId: selectedMesa?.id,
        folioId: payMethod === 'CARGO_HABITACION' ? chargeToFolioId : undefined,
        items: cart.map((i) => ({
          productoId: i.producto.id,
          cantidad: i.cantidad,
        })),
      });

      const comandaId = comandaRes.data?.data?.id;
      if (comandaId) {
        await api.post(`/pos/comandas/${comandaId}/pay`, {
          metodoPago: payMethod,
          monto: totalUsd,
          moneda: 'USD',
          folioId: payMethod === 'CARGO_HABITACION' ? chargeToFolioId : undefined,
        });

        alert('Comanda cobrada con éxito e inventario descontado por receta');
        setShowPayModal(false);
        clearCart();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al procesar cobro');
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Filtrar productos
  const allProducts = menu.flatMap((c) =>
    c.productos.map((p: any) => ({ ...p, categoriaNombre: c.nombre })),
  );

  const filteredProducts = allProducts.filter((p) => {
    if (activeCategory !== 'ALL' && p.categoriaNombre !== activeCategory) return false;
    if (search && !p.nombre.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-gold-400 uppercase tracking-widest">
            Alimentos & Bebidas (F&B)
          </span>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight mt-1 flex items-center gap-3">
            <UtensilsCrossed className="w-7 h-7 text-gold-400" />
            Punto de Venta / Restaurante "El Mirador"
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Comandas de mesa, pantalla KDS de cocina y cargo directo a habitaciones
          </p>
        </div>

        {/* Mesas selector */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {pointsOfSale[0]?.mesas?.map((m: any) => (
            <button
              key={m.id}
              onClick={() => setSelectedMesa(m)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                selectedMesa?.id === m.id
                  ? 'bg-gold-500 text-slate-950 border-gold-400 shadow-md shadow-gold-500/20'
                  : m.estado === 'OCUPADA'
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              Mesa {m.numero}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Catálogo de Menú (2 columnas) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Categorías y Búsqueda */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveCategory('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeCategory === 'ALL'
                    ? 'bg-gold-500 text-slate-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Todos
              </button>
              {menu.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.nombre)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                    activeCategory === c.nombre
                      ? 'bg-gold-500 text-slate-950'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {c.nombre}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar plato o bebida..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-gold-500 w-full sm:w-48"
              />
            </div>
          </div>

          {/* Grid de Productos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => addToCart(p)}
                className="bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800/90 hover:border-gold-500/40 p-4 rounded-2xl transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <span className="text-[10px] font-bold text-gold-400 uppercase tracking-wider">
                    {p.categoriaNombre}
                  </span>
                  <h3 className="text-sm font-bold text-slate-100 group-hover:text-gold-300 transition-colors mt-0.5">
                    {p.nombre}
                  </h3>
                </div>

                <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-800/60">
                  <span className="text-sm font-extrabold text-slate-100">
                    {formatUsd(Number(p.precioUsd))}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {formatBs(Number(p.precioUsd) * tasaBcv)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comanda Activa (1 columna) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 flex flex-col h-[650px] shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-black text-slate-100 uppercase tracking-wider">
                Comanda Activa
              </h2>
              <span className="text-xs font-semibold text-gold-400">
                {selectedMesa ? `Mesa: ${selectedMesa.numero}` : 'Sin mesa asignada'}
              </span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[11px] text-rose-400 hover:underline font-semibold"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Items de la Comanda */}
          <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs">
                <UtensilsCrossed className="w-8 h-8 opacity-40 mb-2" />
                <p>Seleccione productos del menú para armar el pedido</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.producto.id}
                  className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="font-bold text-slate-200 truncate">
                      {item.producto.nombre}
                    </p>
                    <span className="text-[11px] text-slate-500">
                      {formatUsd(Number(item.producto.precioUsd))} c/u
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => removeFromCart(item.producto.id)}
                      className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-bold text-slate-100 w-4 text-center">
                      {item.cantidad}
                    </span>
                    <button
                      onClick={() => addToCart(item.producto)}
                      className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Resumen y Botones de Cobro */}
          <div className="pt-4 border-t border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal:</span>
              <span className="font-mono">{formatUsd(subtotalUsd)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>IVA (16%):</span>
              <span className="font-mono">{formatUsd(ivaUsd)}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-slate-100 pt-1 border-t border-slate-800">
              <span>Total a Cobrar:</span>
              <span className="text-gold-400 font-mono text-base">
                {formatUsd(totalUsd)}
              </span>
            </div>
            <div className="text-right text-[11px] text-slate-500">
              ≈ {formatBs(totalBs)}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={handleSendToKitchen}
                disabled={cart.length === 0 || submittingOrder}
                className="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
              >
                <Send className="w-3.5 h-3.5 text-gold-400" /> A Cocina
              </button>
              <button
                onClick={() => setShowPayModal(true)}
                disabled={cart.length === 0 || submittingOrder}
                className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 disabled:opacity-40 text-slate-950 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-gold-500/20 transition-all"
              >
                <CreditCard className="w-3.5 h-3.5" /> Cobrar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Cobro */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setShowPayModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-100 p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-black text-slate-100 mb-1">
              Cobrar Comanda POS
            </h2>
            <p className="text-xs text-slate-400 mb-5">
              Total: <strong>{formatUsd(totalUsd)}</strong> ({formatBs(totalBs)})
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Método de Pago
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-500 cursor-pointer"
                >
                  <option value="EFECTIVO_USD">Efectivo USD (Divisas)</option>
                  <option value="PAGO_MOVIL">Pago Móvil (Bolívares)</option>
                  <option value="TARJETA_DEBITO">Tarjeta Débito (VES)</option>
                  <option value="ZELLE">Zelle (USD)</option>
                  <option value="CARGO_HABITACION">🏨 Cargar a Habitación (Folio Huésped)</option>
                </select>
              </div>

              {payMethod === 'CARGO_HABITACION' && (
                <div>
                  <label className="block text-xs font-bold text-gold-400 uppercase mb-1">
                    Seleccionar Habitación Ocupada
                  </label>
                  <select
                    value={chargeToFolioId}
                    onChange={(e) => setChargeToFolioId(e.target.value)}
                    className="w-full bg-slate-950 border border-gold-500/50 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-500 cursor-pointer"
                  >
                    <option value="">Seleccione habitación</option>
                    {folios.map((r) => (
                      <option key={r.id} value={r.estancias?.[0]?.folios?.[0]?.id || r.id}>
                        Hab. {r.numero} ({r.tipo?.nombre})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={handleCheckoutAndPay}
                disabled={submittingOrder}
                className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-slate-950 font-bold py-3 rounded-xl transition-all text-xs disabled:opacity-50 mt-4 shadow-lg shadow-gold-500/20"
              >
                {submittingOrder ? 'Procesando...' : 'Finalizar y Facturar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
