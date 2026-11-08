import React, { useEffect, useState } from 'react';
import { api } from '../../lib/axios';
import { formatUsd } from '../../lib/utils';
import {
  CalendarDays,
  Plus,
  Search,
  CheckCircle,
  X,
  CreditCard,
  UserCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ReservationsPage: React.FC = () => {
  const [reservations, setReservations] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  // Form state
  const [huespedNombre, setHuespedNombre] = useState('');
  const [huespedApellido, setHuespedApellido] = useState('');
  const [documentoNum, setDocumentoNum] = useState('');
  const [habitacionId, setHabitacionId] = useState('');
  const [tarifaId, setTarifaId] = useState('');
  const [fechaLlegada, setFechaLlegada] = useState(new Date().toISOString().split('T')[0]);
  const [fechaSalida, setFechaSalida] = useState(
    new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
  );
  const [montoAnticipo, setMontoAnticipo] = useState('0');
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    try {
      const [resRes, roomsRes] = await Promise.all([
        api.get('/pms/reservations'),
        api.get('/pms/rooms?estado=DISPONIBLE'),
      ]);
      if (resRes.data?.data) setReservations(resRes.data.data);
      if (roomsRes.data?.data) setRooms(roomsRes.data.data);
    } catch (err) {
      console.error('Error al cargar reservas', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      // Tomar o crear tarifa por defecto
      const room = rooms.find((r) => r.id === habitacionId);
      const selTarifaId = tarifaId || room?.tipo?.tarifas?.[0]?.id || 'uuid-tarifa';

      await api.post('/pms/reservations', {
        huesped: {
          nombre: huespedNombre,
          apellido: huespedApellido,
          documentoTipo: 'CEDULA',
          documentoNum,
        },
        habitacionId,
        tarifaId: selTarifaId,
        fechaLlegada,
        fechaSalida,
        montoAnticipo: Number(montoAnticipo) || 0,
      });

      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al crear la reserva');
    } finally {
      setCreating(false);
    }
  };

  const handleCheckIn = async (reservaId: string) => {
    try {
      const res = await api.post(`/pms/reservations/${reservaId}/check-in`);
      const folioId = res.data?.data?.folio?.id;
      if (folioId) {
        navigate(`/pms/folio/${folioId}`);
      } else {
        fetchData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al realizar check-in');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl">
        <div>
          <span className="text-xs font-bold text-gold-400 uppercase tracking-widest">
            Gestión de Huéspedes
          </span>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight mt-1 flex items-center gap-3">
            <CalendarDays className="w-7 h-7 text-gold-400" />
            Reservas y Check-in
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Recepción, llegadas previstas y apertura de folios de cuenta
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-gold-500/20 flex items-center gap-2 text-xs"
        >
          <Plus className="w-4 h-4" /> Nueva Reserva
        </button>
      </div>

      {/* Lista de Reservas */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-4 px-6">Código</th>
                <th className="py-4 px-6">Huésped</th>
                <th className="py-4 px-6">Habitación</th>
                <th className="py-4 px-6">Llegada / Salida</th>
                <th className="py-4 px-6">Anticipo</th>
                <th className="py-4 px-6">Estado</th>
                <th className="py-4 px-6 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    Cargando reservas...
                  </td>
                </tr>
              ) : reservations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    No hay reservas registradas. Cree la primera con "Nueva Reserva".
                  </td>
                </tr>
              ) : (
                reservations.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-gold-400">
                      {r.codigoReserva}
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-100">
                      {r.huesped?.nombre} {r.huesped?.apellido}
                      <span className="block text-[11px] text-slate-500 font-normal">
                        {r.huesped?.documentoTipo} {r.huesped?.documentoNum}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-200">
                        Hab. {r.habitacion?.numero}
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        {r.habitacion?.tipo?.nombre}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-300">
                      {r.fechaLlegada?.split('T')[0]} → {r.fechaSalida?.split('T')[0]}
                      <span className="block text-[11px] text-slate-500">
                        {r.noches} noche(s)
                      </span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-200">
                      {formatUsd(Number(r.montoAnticipoUsd))}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          r.estado === 'CHECKIN'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : r.estado === 'CHECKOUT'
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {r.estado}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {r.estado === 'CONFIRMADA' && (
                        <button
                          onClick={() => handleCheckIn(r.id)}
                          className="bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border border-emerald-500/40 font-bold px-3 py-1.5 rounded-lg text-xs transition-all inline-flex items-center gap-1.5"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Check-in
                        </button>
                      )}
                      {r.estado === 'CHECKIN' && r.estancias?.[0]?.folios?.[0] && (
                        <button
                          onClick={() =>
                            navigate(`/pms/folio/${r.estancias[0].folios[0].id}`)
                          }
                          className="text-gold-400 hover:underline font-bold text-xs inline-flex items-center gap-1"
                        >
                          <CreditCard className="w-3.5 h-3.5" /> Ver Folio
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nueva Reserva */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-100 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-black text-slate-100 mb-1">
              Nueva Reserva Hotelera
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Complete los datos del huésped y asigne la habitación
            </p>

            <form onSubmit={handleCreateReservation} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    required
                    value={huespedNombre}
                    onChange={(e) => setHuespedNombre(e.target.value)}
                    placeholder="Ej. Andrés"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Apellido
                  </label>
                  <input
                    type="text"
                    required
                    value={huespedApellido}
                    onChange={(e) => setHuespedApellido(e.target.value)}
                    placeholder="Ej. Bello"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Cédula / Pasaporte / RIF
                </label>
                <input
                  type="text"
                  required
                  value={documentoNum}
                  onChange={(e) => setDocumentoNum(e.target.value)}
                  placeholder="V-12345678"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Habitación Disponible
                </label>
                <select
                  required
                  value={habitacionId}
                  onChange={(e) => {
                    setHabitacionId(e.target.value);
                    const room = rooms.find((r) => r.id === e.target.value);
                    if (room?.tipo?.tarifas?.[0]) {
                      setTarifaId(room.tipo.tarifas[0].id);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-500 cursor-pointer"
                >
                  <option value="">Seleccione una habitación</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Hab. {r.numero} ({r.tipo?.nombre}) - Piso {r.piso}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Fecha Llegada
                  </label>
                  <input
                    type="date"
                    required
                    value={fechaLlegada}
                    onChange={(e) => setFechaLlegada(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Fecha Salida
                  </label>
                  <input
                    type="date"
                    required
                    value={fechaSalida}
                    onChange={(e) => setFechaSalida(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Monto Anticipo ($ USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={montoAnticipo}
                  onChange={(e) => setMontoAnticipo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-500"
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-slate-950 font-bold py-3 rounded-xl transition-all text-xs shadow-lg mt-4 disabled:opacity-50"
              >
                {creating ? 'Guardando...' : 'Confirmar Reserva'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
