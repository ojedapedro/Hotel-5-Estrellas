import React, { useEffect, useState } from 'react';
import { api } from '../../lib/axios';
import {
  Users,
  Plus,
  ShieldCheck,
  Search,
  CheckCircle,
  XCircle,
  X,
  Lock,
} from 'lucide-react';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Admin2026*');
  const [rol, setRol] = useState('RECEPCIONISTA');
  const [cedula, setCedula] = useState('');
  const [telefono, setTelefono] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      if (res.data?.data) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error('Error al cargar usuarios', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/users', {
        nombre,
        apellido,
        email,
        password,
        rol,
        cedula,
        telefono,
      });

      alert('Usuario creado exitosamente');
      setShowModal(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al crear usuario');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await api.patch(`/users/${id}/toggle-active`);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al actualizar usuario');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-gold-400 uppercase tracking-widest">
            Control de Acceso y RBAC
          </span>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight mt-1 flex items-center gap-3">
            <Users className="w-7 h-7 text-gold-400" />
            Gestión de Personal y 11 Roles
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Supervisión de permisos granulares por departamento operativo
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-gold-500/20 flex items-center gap-2 text-xs"
        >
          <Plus className="w-4 h-4" /> Nuevo Empleado
        </button>
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-6">Nombre</th>
                <th className="py-3.5 px-6">Correo</th>
                <th className="py-3.5 px-6">Rol RBAC</th>
                <th className="py-3.5 px-6 text-center">2FA</th>
                <th className="py-3.5 px-6 text-center">Estado</th>
                <th className="py-3.5 px-6 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500">
                    Cargando usuarios...
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40">
                    <td className="py-3.5 px-6 font-semibold text-slate-100">
                      {u.nombre} {u.apellido}
                      <span className="block text-[10px] text-slate-500">
                        {u.cedula || 'Sin cédula'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-mono text-slate-300">
                      {u.email}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/30 uppercase tracking-wider">
                        {u.rol?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.twoFactorEnabled
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {u.twoFactorEnabled ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.activo
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {u.activo ? 'Activo' : 'Desactivado'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => handleToggleActive(u.id)}
                        className="text-xs font-bold text-slate-400 hover:text-gold-400 transition-colors"
                      >
                        {u.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Empleado */}
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
              Alta de Nuevo Empleado
            </h2>
            <p className="text-xs text-slate-400 mb-5">
              Asigne el rol adecuado según el departamento
            </p>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
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
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Rol y Permisos
                </label>
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-500 cursor-pointer"
                >
                  <option value="RECEPCIONISTA">Recepcionista / Front Desk</option>
                  <option value="AUDITOR_NOCTURNO">Auditor Nocturno</option>
                  <option value="CAJERO_POS">Cajero POS / Restaurante</option>
                  <option value="MESERO">Mesero de Sala</option>
                  <option value="COMPRAS_ALMACEN">Compras y Almacenes</option>
                  <option value="CONTADOR">Contador / Finanzas</option>
                  <option value="GERENTE_GENERAL">Gerente General</option>
                  <option value="RRHH_NOMINA">RRHH y Nómina</option>
                  <option value="TECNICO_MANTENIMIENTO">Técnico Mantenimiento / Housekeeping</option>
                  <option value="EJECUTIVO_EVENTOS">Coordinador de Eventos</option>
                  <option value="SUPER_ADMIN">Super Admin del Sistema</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Cédula
                  </label>
                  <input
                    type="text"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    placeholder="V-12345678"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="+58 412..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-slate-950 font-bold py-2.5 rounded-xl transition-all text-xs disabled:opacity-50 mt-4 shadow-lg shadow-gold-500/20"
              >
                {submitting ? 'Creando...' : 'Crear Usuario'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
