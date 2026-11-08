import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import {
  Users, DollarSign, Calendar, Plus, X, CheckCircle, Briefcase, Award
} from 'lucide-react';

interface Empleado {
  id: string;
  cedula: string;
  nombre: string;
  apellido: string;
  cargo: string;
  departamento: string;
  salarioBaseUsd: number;
  tipoContrato: string;
  estado: string;
  email?: string;
  telefono?: string;
}

interface Nomina {
  id: string;
  periodoNombre: string;
  fechaPago: string;
  estado: string;
  totalBrutoUsd: number;
  totalDeduccionesUsd: number;
  totalNetoUsd: number;
  totalNetoBs: number;
  _count?: { lineas: number };
}

interface KPIs {
  totalActivos: number;
  porDepartamento: { departamento: string; _count: { _all: number } }[];
  nominaMes?: { periodoNombre: string; totalNetoUsd: number; totalNetoBs: number; estado: string };
}

const ESTADO_COLORS: Record<string, string> = {
  ACTIVO: 'text-green-400 bg-green-900/40',
  VACACIONES: 'text-yellow-400 bg-yellow-900/40',
  REPOSO: 'text-blue-400 bg-blue-900/40',
  RETIRADO: 'text-red-400 bg-red-900/40',
};

const NOMINA_COLORS: Record<string, string> = {
  CALCULADA: 'text-yellow-400 bg-yellow-900/40',
  APROBADA: 'text-blue-400 bg-blue-900/40',
  PAGADA: 'text-green-400 bg-green-900/40',
};

export default function RrhhPage() {
  const [tab, setTab] = useState<'empleados' | 'nominas'>('empleados');
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [nominas, setNominas] = useState<Nomina[]>([]);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showNewEmpleado, setShowNewEmpleado] = useState(false);
  const [showNewNomina, setShowNewNomina] = useState(false);

  // Form empleado
  const [empForm, setEmpForm] = useState({
    cedula: '',
    nombre: '',
    apellido: '',
    cargo: '',
    departamento: 'RECEPCION',
    fechaIngreso: new Date().toISOString().split('T')[0],
    salarioBaseUsd: 500,
    tipoContrato: 'FIJO',
    email: '',
    telefono: '',
    banco: 'Banesco',
    numeroCuenta: '',
  });

  // Form nomina
  const [nomForm, setNomForm] = useState({
    periodoNombre: `Quincena ${new Date().toLocaleDateString('es-VE', { month: 'long', year: 'numeric' })}`,
    fechaDesde: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    fechaHasta: new Date(new Date().getFullYear(), new Date().getMonth(), 15).toISOString().split('T')[0],
    fechaPago: new Date(new Date().getFullYear(), new Date().getMonth(), 15).toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, [tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, nomRes, kpiRes] = await Promise.all([
        api.get('/rrhh/empleados'),
        api.get('/rrhh/nominas'),
        api.get('/rrhh/kpis'),
      ]);
      setEmpleados(empRes.data);
      setNominas(nomRes.data);
      setKpis(kpiRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEmpleado = async () => {
    try {
      await api.post('/rrhh/empleados', empForm);
      setShowNewEmpleado(false);
      setEmpForm({
        cedula: '',
        nombre: '',
        apellido: '',
        cargo: '',
        departamento: 'RECEPCION',
        fechaIngreso: new Date().toISOString().split('T')[0],
        salarioBaseUsd: 500,
        tipoContrato: 'FIJO',
        email: '',
        telefono: '',
        banco: 'Banesco',
        numeroCuenta: '',
      });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al guardar empleado');
    }
  };

  const handleCalcularNomina = async () => {
    try {
      await api.post('/rrhh/nominas', nomForm);
      setShowNewNomina(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al calcular nómina');
    }
  };

  const handleAprobarNomina = async (id: string) => {
    if (!confirm('¿Aprobar esta nómina de personal?')) return;
    try {
      await api.patch(`/rrhh/nominas/${id}/aprobar`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al aprobar nómina');
    }
  };

  const handlePagarNomina = async (id: string) => {
    if (!confirm('¿Confirmar desembolso y pago de esta nómina?')) return;
    try {
      await api.patch(`/rrhh/nominas/${id}/pagar`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al pagar nómina');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gold-400">Recursos Humanos y Nómina</h1>
          <p className="text-gray-400 text-sm mt-1">Gestión del talento, nómina quincenal y ley laboral venezolana</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowNewEmpleado(true)}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gold-500/30 text-gold-400 px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
          >
            <Plus size={16} />
            Nuevo Empleado
          </button>
          <button
            onClick={() => setShowNewNomina(true)}
            className="flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-black px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
          >
            <DollarSign size={16} />
            Calcular Nómina
          </button>
        </div>
      </div>

      {/* KPIs */}
      {kpis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users size={18} className="text-blue-400" />
              <span className="text-gray-400 text-xs">Personal Activo</span>
            </div>
            <p className="text-2xl font-bold text-blue-400">{kpis.totalActivos}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase size={18} className="text-yellow-400" />
              <span className="text-gray-400 text-xs">Departamentos</span>
            </div>
            <p className="text-2xl font-bold text-yellow-400">{kpis.porDepartamento?.length || 0}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={18} className="text-gold-400" />
              <span className="text-gray-400 text-xs">Última Nómina (USD)</span>
            </div>
            <p className="text-2xl font-bold text-gold-400">
              ${Number(kpis.nominaMes?.totalNetoUsd || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award size={18} className="text-green-400" />
              <span className="text-gray-400 text-xs">Estado de Pago</span>
            </div>
            <p className="text-xl font-bold text-green-400">
              {kpis.nominaMes?.estado || 'AL DÍA'}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-lg p-1 w-fit">
        {(['empleados', 'nominas'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
              tab === t ? 'bg-gold-500 text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t === 'empleados' ? 'Ficha de Empleados' : 'Nóminas y Pagos'}
          </button>
        ))}
      </div>

      {/* Tab: Empleados */}
      {tab === 'empleados' && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 text-gray-400">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Cédula</th>
                  <th className="px-4 py-3 text-left font-medium">Empleado</th>
                  <th className="px-4 py-3 text-left font-medium">Cargo</th>
                  <th className="px-4 py-3 text-left font-medium">Departamento</th>
                  <th className="px-4 py-3 text-right font-medium">Salario Base</th>
                  <th className="px-4 py-3 text-center font-medium">Contrato</th>
                  <th className="px-4 py-3 text-center font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-400">Cargando nómina...</td></tr>
                ) : empleados.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-400">No hay empleados registrados</td></tr>
                ) : empleados.map(emp => (
                  <tr key={emp.id} className="hover:bg-gray-750 transition-colors">
                    <td className="px-4 py-3 font-mono text-gold-400">{emp.cedula}</td>
                    <td className="px-4 py-3 font-medium text-white">{emp.nombre} {emp.apellido}</td>
                    <td className="px-4 py-3 text-gray-300">{emp.cargo}</td>
                    <td className="px-4 py-3 text-gray-400">{emp.departamento}</td>
                    <td className="px-4 py-3 text-right font-semibold text-white">
                      ${Number(emp.salarioBaseUsd).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-300">{emp.tipoContrato}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${ESTADO_COLORS[emp.estado] || 'text-gray-400 bg-gray-800'}`}>
                        {emp.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Nominas */}
      {tab === 'nominas' && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 text-gray-400">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Período</th>
                  <th className="px-4 py-3 text-left font-medium">Fecha de Pago</th>
                  <th className="px-4 py-3 text-right font-medium">Total Bruto USD</th>
                  <th className="px-4 py-3 text-right font-medium">Deducciones (Ley)</th>
                  <th className="px-4 py-3 text-right font-medium">Total Neto USD</th>
                  <th className="px-4 py-3 text-right font-medium">Total Neto Bs</th>
                  <th className="px-4 py-3 text-center font-medium">Estado</th>
                  <th className="px-4 py-3 text-center font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-8 text-gray-400">Cargando...</td></tr>
                ) : nominas.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-8 text-gray-400">No hay períodos de nómina generados</td></tr>
                ) : nominas.map(n => (
                  <tr key={n.id} className="hover:bg-gray-750 transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{n.periodoNombre}</td>
                    <td className="px-4 py-3 text-gray-400">{new Date(n.fechaPago).toLocaleDateString('es-VE')}</td>
                    <td className="px-4 py-3 text-right text-gray-300">
                      ${Number(n.totalBrutoUsd).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right text-red-400">
                      -${Number(n.totalDeduccionesUsd).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gold-400">
                      ${Number(n.totalNetoUsd).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 text-xs">
                      Bs {Number(n.totalNetoBs).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${NOMINA_COLORS[n.estado] || 'text-gray-400'}`}>
                        {n.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {n.estado === 'CALCULADA' && (
                          <button
                            onClick={() => handleAprobarNomina(n.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded text-xs font-medium"
                          >
                            Aprobar
                          </button>
                        )}
                        {n.estado === 'APROBADA' && (
                          <button
                            onClick={() => handlePagarNomina(n.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 rounded text-xs font-medium"
                          >
                            Pagar
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

      {/* Modal: Nuevo Empleado */}
      {showNewEmpleado && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-lg border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-700">
              <h2 className="text-lg font-bold text-gold-400">Registrar Nuevo Empleado</h2>
              <button onClick={() => setShowNewEmpleado(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Cédula *</label>
                  <input
                    value={empForm.cedula}
                    onChange={e => setEmpForm(prev => ({ ...prev, cedula: e.target.value }))}
                    placeholder="V-12345678"
                    className="w-full bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Salario Base USD *</label>
                  <input
                    type="number"
                    value={empForm.salarioBaseUsd}
                    onChange={e => setEmpForm(prev => ({ ...prev, salarioBaseUsd: +e.target.value }))}
                    className="w-full bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Nombre *</label>
                  <input
                    value={empForm.nombre}
                    onChange={e => setEmpForm(prev => ({ ...prev, nombre: e.target.value }))}
                    className="w-full bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Apellido *</label>
                  <input
                    value={empForm.apellido}
                    onChange={e => setEmpForm(prev => ({ ...prev, apellido: e.target.value }))}
                    className="w-full bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Cargo *</label>
                  <input
                    value={empForm.cargo}
                    onChange={e => setEmpForm(prev => ({ ...prev, cargo: e.target.value }))}
                    placeholder="Recepcionista, Chef, etc."
                    className="w-full bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Departamento *</label>
                  <select
                    value={empForm.departamento}
                    onChange={e => setEmpForm(prev => ({ ...prev, departamento: e.target.value }))}
                    className="w-full bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm"
                  >
                    <option value="RECEPCION">Recepción y Front Desk</option>
                    <option value="ALIMENTOS_BEBIDAS">Alimentos y Bebidas (A&B)</option>
                    <option value="HOUSEKEEPING">Housekeeping y Pisos</option>
                    <option value="MANTENIMIENTO">Mantenimiento y Obras</option>
                    <option value="ADMINISTRACION">Administración y Finanzas</option>
                    <option value="SEGURIDAD">Seguridad y Vigilancia</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Email</label>
                  <input
                    value={empForm.email}
                    onChange={e => setEmpForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Teléfono</label>
                  <input
                    value={empForm.telefono}
                    onChange={e => setEmpForm(prev => ({ ...prev, telefono: e.target.value }))}
                    className="w-full bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-700">
              <button
                onClick={() => setShowNewEmpleado(false)}
                className="flex-1 py-2 border border-gray-600 text-gray-300 rounded-lg text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEmpleado}
                className="flex-1 py-2 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg text-sm"
              >
                Guardar Empleado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Calcular Nómina */}
      {showNewNomina && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl w-full max-w-md border border-gray-700 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-700">
              <h2 className="text-lg font-bold text-gold-400">Calcular Período de Nómina</h2>
              <button onClick={() => setShowNewNomina(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Nombre del Período *</label>
                <input
                  value={nomForm.periodoNombre}
                  onChange={e => setNomForm(prev => ({ ...prev, periodoNombre: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Desde *</label>
                  <input
                    type="date"
                    value={nomForm.fechaDesde}
                    onChange={e => setNomForm(prev => ({ ...prev, fechaDesde: e.target.value }))}
                    className="w-full bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Hasta *</label>
                  <input
                    type="date"
                    value={nomForm.fechaHasta}
                    onChange={e => setNomForm(prev => ({ ...prev, fechaHasta: e.target.value }))}
                    className="w-full bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Fecha de Desembolso / Pago *</label>
                <input
                  type="date"
                  value={nomForm.fechaPago}
                  onChange={e => setNomForm(prev => ({ ...prev, fechaPago: e.target.value }))}
                  className="w-full bg-gray-900 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm"
                />
              </div>
              <div className="bg-yellow-900/30 border border-yellow-700/50 p-3 rounded-lg text-xs text-yellow-300">
                ⚡ Aplica deducciones de ley: IVSS (4%), FAOV (1%), LPH (0.5%) y convierte a Bs con la tasa BCV oficial del momento.
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t border-gray-700">
              <button
                onClick={() => setShowNewNomina(false)}
                className="flex-1 py-2 border border-gray-600 text-gray-300 rounded-lg text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleCalcularNomina}
                className="flex-1 py-2 bg-gold-500 hover:bg-gold-600 text-black font-semibold rounded-lg text-sm"
              >
                Ejecutar Cálculo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
