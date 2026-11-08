import React, { useEffect, useState } from 'react';
import { api } from '../../lib/axios';
import { socket } from '../../lib/socket';
import { Habitacion, EstadoHabitacion } from '../../types';
import {
  BedDouble,
  Filter,
  CheckCircle2,
  XCircle,
  Wrench,
  Sparkles,
  Lock,
  X,
  CreditCard,
  User,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const RoomsMapPage: React.FC = () => {
  const [rooms, setRooms] = useState<Habitacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState<number | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedRoom, setSelectedRoom] = useState<Habitacion | null>(null);
  const [changingStatus, setChangingStatus] = useState(false);
  const navigate = useNavigate();

  const fetchRooms = async () => {
    try {
      const res = await api.get('/pms/rooms/map');
      if (res.data?.rooms) {
        setRooms(res.data.rooms);
      }
    } catch (err) {
      console.error('Error al cargar mapa de habitaciones', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();

    // Escuchar cambios de estado en vivo vía WebSockets
    socket.on('room_status_changed', (data: { habitacionId: string; nuevoEstado: EstadoHabitacion }) => {
      setRooms((prev) =>
        prev.map((r) =>
          r.id === data.habitacionId ? { ...r, estado: data.nuevoEstado } : r,
        ),
      );
    });

    return () => {
      socket.off('room_status_changed');
    };
  }, []);

  const handleUpdateStatus = async (nuevoEstado: EstadoHabitacion) => {
    if (!selectedRoom) return;
    setChangingStatus(true);
    try {
      await api.patch(`/pms/rooms/${selectedRoom.id}/status`, {
        estado: nuevoEstado,
      });
      setSelectedRoom((prev) => (prev ? { ...prev, estado: nuevoEstado } : null));
      setRooms((prev) =>
        prev.map((r) =>
          r.id === selectedRoom.id ? { ...r, estado: nuevoEstado } : r,
        ),
      );
    } catch (err) {
      console.error('Error al actualizar estado', err);
    } finally {
      setChangingStatus(false);
    }
  };

  // Filtrado
  const filteredRooms = rooms.filter((r) => {
    if (selectedFloor !== 'ALL' && r.piso !== selectedFloor) return false;
    if (selectedStatus !== 'ALL' && r.estado !== selectedStatus) return false;
    return true;
  });

  const getStatusBadge = (estado: EstadoHabitacion) => {
    switch (estado) {
      case 'DISPONIBLE':
        return {
          bg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
          dot: 'bg-emerald-400',
          label: 'Disponible',
        };
      case 'OCUPADA':
        return {
          bg: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
          dot: 'bg-rose-400',
          label: 'Ocupada',
        };
      case 'LIMPIEZA':
        return {
          bg: 'bg-amber-400/20 text-amber-300 border-amber-400/40',
          dot: 'bg-amber-400',
          label: 'Limpieza',
        };
      case 'MANTENIMIENTO':
        return {
          bg: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
          dot: 'bg-orange-400',
          label: 'Mantenimiento',
        };
      case 'BLOQUEADA':
        return {
          bg: 'bg-slate-700/40 text-slate-400 border-slate-600',
          dot: 'bg-slate-500',
          label: 'Bloqueada',
        };
      default:
        return {
          bg: 'bg-slate-800 text-slate-400 border-slate-700',
          dot: 'bg-slate-500',
          label: estado,
        };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header y Filtros */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl">
        <div>
          <span className="text-xs font-bold text-gold-400 uppercase tracking-widest">
            Property Management System (PMS)
          </span>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight mt-1 flex items-center gap-3">
            <BedDouble className="w-7 h-7 text-gold-400" />
            Mapa de Habitaciones (200 Cuartos)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Visualización arquitectónica de los 10 pisos con sincronización en tiempo real vía WebSockets
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Filtro por Piso */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400 font-medium">Piso:</span>
            <select
              value={selectedFloor}
              onChange={(e) =>
                setSelectedFloor(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
              }
              className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">Todos los Pisos (1-10)</option>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((p) => (
                <option key={p} value={p}>
                  Piso {p}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Estado */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-slate-400 font-medium">Estado:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="DISPONIBLE">Disponibles</option>
              <option value="OCUPADA">Ocupadas</option>
              <option value="LIMPIEZA">En Limpieza</option>
              <option value="MANTENIMIENTO">En Mantenimiento</option>
              <option value="BLOQUEADA">Bloqueadas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid de Habitaciones */}
      {loading ? (
        <div className="flex items-center justify-center p-20 text-slate-500">
          <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 xl:grid-cols-10 gap-3">
          {filteredRooms.map((room) => {
            const badge = getStatusBadge(room.estado);
            return (
              <div
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                className={`p-3.5 rounded-2xl border transition-all duration-150 cursor-pointer flex flex-col justify-between hover:scale-[1.03] hover:shadow-xl ${badge.bg}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black tracking-tight text-slate-100">
                    {room.numero}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                </div>

                <div className="mt-3">
                  <p className="text-[10px] font-semibold text-slate-300 truncate">
                    {room.tipo?.nombre?.replace('Habitación ', '') || 'Estándar'}
                  </p>
                  <span className="text-[9px] uppercase font-bold tracking-wider opacity-80">
                    {badge.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Detalle de Habitación */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedRoom(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-100 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400 font-black text-xl">
                {selectedRoom.numero}
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-100">
                  Habitación {selectedRoom.numero}
                </h2>
                <p className="text-xs text-gold-400 font-semibold">
                  Piso {selectedRoom.piso} · {selectedRoom.tipo?.nombre}
                </p>
              </div>
            </div>

            {/* Estado actual */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 mb-6">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Estado Actual
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${getStatusBadge(selectedRoom.estado).dot}`}
                />
                <span className="text-base font-bold text-slate-200">
                  {getStatusBadge(selectedRoom.estado).label}
                </span>
              </div>

              {/* Si hay huésped activo */}
              {selectedRoom.estancias?.[0] && (
                <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gold-400" />
                    <span>
                      {selectedRoom.estancias[0].huesped?.nombre}{' '}
                      {selectedRoom.estancias[0].huesped?.apellido}
                    </span>
                  </div>
                  {selectedRoom.estancias[0].folios?.[0] && (
                    <button
                      onClick={() => {
                        navigate(`/pms/folio/${selectedRoom.estancias![0].folios[0].id}`);
                      }}
                      className="text-xs font-bold text-gold-400 hover:underline flex items-center gap-1"
                    >
                      <CreditCard className="w-3.5 h-3.5" /> Ver Folio
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Acciones de cambio de estado */}
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
                Cambiar Estado Operativo:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  disabled={changingStatus || selectedRoom.estado === 'DISPONIBLE'}
                  onClick={() => handleUpdateStatus('DISPONIBLE')}
                  className="p-3 rounded-xl bg-slate-950 hover:bg-emerald-500/10 border border-slate-800 hover:border-emerald-500/40 text-emerald-400 font-bold flex items-center gap-2 transition-all disabled:opacity-40"
                >
                  <CheckCircle2 className="w-4 h-4" /> Disponible
                </button>
                <button
                  disabled={changingStatus || selectedRoom.estado === 'OCUPADA'}
                  onClick={() => handleUpdateStatus('OCUPADA')}
                  className="p-3 rounded-xl bg-slate-950 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/40 text-rose-400 font-bold flex items-center gap-2 transition-all disabled:opacity-40"
                >
                  <XCircle className="w-4 h-4" /> Ocupada
                </button>
                <button
                  disabled={changingStatus || selectedRoom.estado === 'LIMPIEZA'}
                  onClick={() => handleUpdateStatus('LIMPIEZA')}
                  className="p-3 rounded-xl bg-slate-950 hover:bg-amber-400/10 border border-slate-800 hover:border-amber-400/40 text-amber-300 font-bold flex items-center gap-2 transition-all disabled:opacity-40"
                >
                  <Sparkles className="w-4 h-4" /> En Limpieza
                </button>
                <button
                  disabled={changingStatus || selectedRoom.estado === 'MANTENIMIENTO'}
                  onClick={() => handleUpdateStatus('MANTENIMIENTO')}
                  className="p-3 rounded-xl bg-slate-950 hover:bg-orange-500/10 border border-slate-800 hover:border-orange-500/40 text-orange-400 font-bold flex items-center gap-2 transition-all disabled:opacity-40"
                >
                  <Wrench className="w-4 h-4" /> Mantenimiento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
