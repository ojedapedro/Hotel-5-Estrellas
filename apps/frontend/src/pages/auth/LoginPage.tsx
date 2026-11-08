import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { api } from '../../lib/axios';
import { Crown, Lock, Mail, ShieldAlert, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@hotel.com');
  const [password, setPassword] = useState('Admin2026*');
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [needs2fa, setNeeds2fa] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/login', {
        email,
        password,
        twoFactorToken: needs2fa ? twoFactorToken : undefined,
      });

      if (res.data?.requires2fa) {
        setNeeds2fa(true);
        setLoading(false);
        return;
      }

      if (res.data?.accessToken && res.data?.user) {
        setAuth(res.data.user, res.data.accessToken);
        navigate('/dashboard');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message;
      if (msg) {
        setError(msg);
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        setError(
          'No se pudo conectar con el servidor backend (puerto 3001). Asegúrese de que el backend esté iniciado.',
        );
      } else {
        setError('Error al iniciar sesión. Verifique sus credenciales.');
      }
    } finally {
      setLoading(false);
    }
  };

  const setDemoUser = (userEmail: string) => {
    setEmail(userEmail);
    setPassword('Admin2026*');
    setNeeds2fa(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gold-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-gold-600 via-gold-500 to-gold-400 flex items-center justify-center text-slate-950 shadow-lg shadow-gold-500/25 mb-4">
            <Crown className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-wider">
            GRAN HOTEL CARACAS
          </h1>
          <p className="text-xs font-bold text-gold-400 uppercase tracking-widest mt-1">
            ★★★★★ Sistema Integrado ERP + PMS
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-400 text-sm">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!needs2fa ? (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="usuario@hotel.com"
                    className="w-full bg-slate-950/70 border border-slate-800 focus:border-gold-500 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-slate-950/70 border border-slate-800 focus:border-gold-500 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-bold text-gold-400 uppercase tracking-wider mb-2">
                Código de Autenticación 2FA
              </label>
              <input
                type="text"
                maxLength={6}
                value={twoFactorToken}
                onChange={(e) => setTwoFactorToken(e.target.value)}
                required
                placeholder="123456"
                className="w-full bg-slate-950/80 border border-gold-500/50 rounded-xl py-3 text-center text-2xl tracking-[0.5em] font-mono text-gold-400 focus:outline-none"
              />
              <p className="text-xs text-slate-400 text-center mt-2">
                Ingrese el código de 6 dígitos de su aplicación autenticadora.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-slate-950 font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-gold-500/20 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{needs2fa ? 'Verificar y Entrar' : 'Iniciar Sesión'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Login Buttons */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
            Acceso Rápido de Prueba (Demo 11 Roles):
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => setDemoUser('admin@hotel.com')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/70 hover:bg-gold-500/10 hover:text-gold-400 text-slate-300 border border-slate-700/60 transition-colors text-left truncate"
            >
              👑 Super Admin
            </button>
            <button
              onClick={() => setDemoUser('gerente@hotel.com')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/70 hover:bg-gold-500/10 hover:text-gold-400 text-slate-300 border border-slate-700/60 transition-colors text-left truncate"
            >
              💼 Gerente General
            </button>
            <button
              onClick={() => setDemoUser('recepcion@hotel.com')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/70 hover:bg-gold-500/10 hover:text-gold-400 text-slate-300 border border-slate-700/60 transition-colors text-left truncate"
            >
              🛎️ Recepción
            </button>
            <button
              onClick={() => setDemoUser('contador@hotel.com')}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/70 hover:bg-gold-500/10 hover:text-gold-400 text-slate-300 border border-slate-700/60 transition-colors text-left truncate"
            >
              📊 Contador
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
