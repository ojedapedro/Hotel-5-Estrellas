import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/axios';
import { useHotelStore } from '../../stores/hotel.store';
import { formatUsd, formatBs } from '../../lib/utils';
import {
  CreditCard,
  Plus,
  ArrowLeft,
  DollarSign,
  Receipt,
  User,
  BedDouble,
  LogOut,
  X,
  AlertCircle,
} from 'lucide-react';

export const FolioPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tasaBcv } = useHotelStore();

  const [folio, setFolio] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modales
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Cargo Form
  const [cargoConcepto, setCargoConcepto] = useState('Consumo Minibar');
  const [cargoMontoUsd, setCargoMontoUsd] = useState('15');
  const [submittingCharge, setSubmittingCharge] = useState(false);

  // Pago Form
  const [pagoMetodo, setPagoMetodo] = useState('EFECTIVO_USD');
  const [pagoMonto, setPagoMonto] = useState('');
  const [pagoMoneda, setPagoMoneda] = useState<'USD' | 'VES'>('USD');
  const [pagoRef, setPagoRef] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const fetchFolio = async () => {
    try {
      const res = await api.get(`/pms/folios/${id}`);
      if (res.data?.data) {
        setFolio(res.data.data);
        setPagoMonto(Math.max(0, Number(res.data.data.saldoUsd)).toFixed(2));
      }
    } catch (err) {
      console.error('Error al cargar folio', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolio();
  }, [id]);

  const handleAddCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCharge(true);
    try {
      await api.post(`/pms/folios/${id}/charges`, {
        concepto: cargoConcepto,
        montoUsd: Number(cargoMontoUsd),
        tipo: 'MINIBAR',
      });
      setShowChargeModal(false);
      fetchFolio();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al agregar cargo');
    } finally {
      setSubmittingCharge(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPayment(true);
    try {
      await api.post(`/pms/folios/${id}/payments`, {
        metodoPago: pagoMetodo,
        monto: Number(pagoMonto),
        moneda: pagoMoneda,
        referencia: pagoRef || undefined,
      });
      setShowPaymentModal(false);
      fetchFolio();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al registrar pago');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleCheckout = async () => {
    if (!confirm('¿Confirma el cierre de folio y check-out de la habitación?')) return;
    try {
      await api.post(`/pms/reservations/folio/${id}/check-out`);
      alert('Check-out completado. Habitación enviada a LIMPIEZA.');
      navigate('/pms/rooms');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al realizar check-out');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20 text-slate-500">
        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!folio) {
    return <div className="text-center p-20 text-slate-400">Folio no encontrado.</div>;
  }

  const saldoUsd = Number(folio.saldoUsd);
  const saldoBs = Number(folio.saldoBs);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="text-xs font-bold text-slate-400 hover:text-gold-400 flex items-center gap-2 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a PMS
      </button>

      {/* Header del Folio */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-gold-400 bg-gold-500/10 border border-gold-500/20 px-2.5 py-1 rounded-lg">
              {folio.codigoFolio}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                folio.estado === 'ABIERTO'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {folio.estado}
            </span>
          </div>

          <h1 className="text-2xl font-black text-slate-100 mt-2 flex items-center gap-2">
            <User className="w-6 h-6 text-gold-400" />
            {folio.estancia?.huesped?.nombre} {folio.estancia?.huesped?.apellido}
          </h1>

          <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-300 font-semibold">
              <BedDouble className="w-4 h-4 text-gold-400" /> Hab. {folio.estancia?.habitacion?.numero}
            </span>
            <span>·</span>
            <span>Check-in: {folio.estancia?.fechaCheckin?.split('T')[0]}</span>
            <span>·</span>
            <span>Doc: {folio.estancia?.huesped?.documentoNum}</span>
          </p>
        </div>

        {/* Saldo Prominente */}
        <div className="flex flex-col items-end bg-slate-950/80 border border-slate-800/90 p-4 rounded-2xl">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Saldo Pendiente de Pago
          </span>
          <div
            className={`text-2xl font-black mt-1 ${
              saldoUsd > 0.05
                ? 'text-rose-400'
                : saldoUsd < -0.05
                ? 'text-emerald-400'
                : 'text-slate-300'
            }`}
          >
            {formatUsd(saldoUsd)}
          </div>
          <span className="text-xs text-slate-500 mt-0.5">
            ≈ {formatBs(saldoBs)}
          </span>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowChargeModal(true)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 border border-slate-700 transition-colors"
          >
            <Plus className="w-4 h-4 text-gold-400" /> Cargar Consumo
          </button>
          <button
            onClick={() => setShowPaymentModal(true)}
            className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-gold-500/20 transition-all"
          >
            <CreditCard className="w-4 h-4" /> Registrar Pago / Abono
          </button>
        </div>

        <button
          onClick={handleCheckout}
          disabled={saldoUsd > 0.05}
          className="bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-slate-100 font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-2 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Check-out de Habitación
        </button>
      </div>

      {/* Tablas de Cargos y Pagos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tabla de Cargos */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <h2 className="text-sm font-extrabold text-slate-100 mb-4 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-gold-400" /> Cargos Realizados (Consumos)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-800">
                <tr>
                  <th className="pb-2">Concepto</th>
                  <th className="pb-2 text-right">Base</th>
                  <th className="pb-2 text-right">Total USD</th>
                  <th className="pb-2 text-right">Total Bs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {folio.cargos?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500">
                      No hay cargos registrados
                    </td>
                  </tr>
                ) : (
                  folio.cargos?.map((c: any) => (
                    <tr key={c.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 font-medium text-slate-200">
                        {c.concepto}
                        <span className="block text-[10px] text-slate-500">
                          {c.tipo} · {c.createdAt?.split('T')[0]}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-mono text-slate-400">
                        {formatUsd(Number(c.baseImponibleUsd))}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-slate-100">
                        {formatUsd(Number(c.montoUsd))}
                      </td>
                      <td className="py-2.5 text-right font-mono text-slate-400">
                        {formatBs(Number(c.montoBs))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabla de Pagos */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl">
          <h2 className="text-sm font-extrabold text-slate-100 mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-400" /> Pagos y Abonos Recibidos
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[10px] uppercase font-bold text-slate-500 border-b border-slate-800">
                <tr>
                  <th className="pb-2">Método</th>
                  <th className="pb-2">Referencia</th>
                  <th className="pb-2 text-right">IGTF (3%)</th>
                  <th className="pb-2 text-right">Abono USD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {folio.pagos?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-500">
                      No hay pagos registrados
                    </td>
                  </tr>
                ) : (
                  folio.pagos?.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 font-medium text-slate-200">
                        {p.metodoPago?.replace(/_/g, ' ')}
                        <span className="block text-[10px] text-slate-500">
                          {p.createdAt?.split('T')[0]}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-400 font-mono">
                        {p.referencia || 'N/A'}
                      </td>
                      <td className="py-2.5 text-right font-mono text-amber-400">
                        {Number(p.igtfMonto) > 0 ? formatUsd(Number(p.igtfMonto)) : '-'}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-emerald-400">
                        {formatUsd(Number(p.montoUsd))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Cargar Consumo */}
      {showChargeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setShowChargeModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-100 p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-black text-slate-100 mb-1">
              Cargar Consumo al Folio
            </h2>
            <p className="text-xs text-slate-400 mb-5">
              Aplica IVA (16%) y congela la tasa oficial del día
            </p>

            <form onSubmit={handleAddCharge} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Concepto del Consumo
                </label>
                <input
                  type="text"
                  required
                  value={cargoConcepto}
                  onChange={(e) => setCargoConcepto(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Monto Base ($ USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={cargoMontoUsd}
                  onChange={(e) => setCargoMontoUsd(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1 text-slate-400">
                <div className="flex justify-between">
                  <span>Base Imponible:</span>
                  <span>{formatUsd(Number(cargoMontoUsd) || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA (16%):</span>
                  <span>{formatUsd((Number(cargoMontoUsd) || 0) * 0.16)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-100 pt-1 border-t border-slate-800">
                  <span>Total Cargo:</span>
                  <span className="text-gold-400">
                    {formatUsd((Number(cargoMontoUsd) || 0) * 1.16)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingCharge}
                className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-slate-950 font-bold py-2.5 rounded-xl transition-all text-xs disabled:opacity-50"
              >
                {submittingCharge ? 'Procesando...' : 'Confirmar Cargo'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Pago con IGTF */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-100 p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-black text-slate-100 mb-1">
              Registrar Abono / Pago
            </h2>
            <p className="text-xs text-slate-400 mb-5">
              Soporte de pagos mixtos (Bolívares, USD, Zelle, Pago Móvil)
            </p>

            <form onSubmit={handleAddPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Método de Pago
                </label>
                <select
                  value={pagoMetodo}
                  onChange={(e) => {
                    setPagoMetodo(e.target.value);
                    if (
                      e.target.value === 'PAGO_MOVIL' ||
                      e.target.value === 'EFECTIVO_VES' ||
                      e.target.value === 'TARJETA_DEBITO' ||
                      e.target.value === 'TRANSFERENCIA_VES'
                    ) {
                      setPagoMoneda('VES');
                    } else {
                      setPagoMoneda('USD');
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-500 cursor-pointer"
                >
                  <option value="EFECTIVO_USD">Efectivo Divisas (USD) - Aplica IGTF 3%</option>
                  <option value="ZELLE">Zelle (USD) - Aplica IGTF 3%</option>
                  <option value="TARJETA_CREDITO_INT">Tarjeta Internacional - Aplica IGTF 3%</option>
                  <option value="BINANCE">Binance / Cripto (USDT) - Aplica IGTF 3%</option>
                  <option value="PAGO_MOVIL">Pago Móvil (Bolívares VES)</option>
                  <option value="TARJETA_DEBITO">Tarjeta Débito Nacional (VES)</option>
                  <option value="EFECTIVO_VES">Efectivo Bolívares (VES)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Monto
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={pagoMonto}
                    onChange={(e) => setPagoMonto(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Moneda
                  </label>
                  <select
                    value={pagoMoneda}
                    onChange={(e) => setPagoMoneda(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-500 cursor-pointer"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="VES">Bolívares (Bs)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Número de Referencia
                </label>
                <input
                  type="text"
                  value={pagoRef}
                  onChange={(e) => setPagoRef(e.target.value)}
                  placeholder="Ej. REF-987654"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-500"
                />
              </div>

              {/* Advertencia IGTF */}
              {['EFECTIVO_USD', 'ZELLE', 'TARJETA_CREDITO_INT', 'BINANCE'].includes(pagoMetodo) && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    Operación en divisas sujeta a <strong>3% de IGTF</strong> según ley venezolana.
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={submittingPayment}
                className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-slate-950 font-bold py-2.5 rounded-xl transition-all text-xs disabled:opacity-50"
              >
                {submittingPayment ? 'Registrando...' : 'Confirmar Abono'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
