import { create } from 'zustand';
import { User, Role } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  hasRole: (roles: Role[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => {
  const savedToken = localStorage.getItem('hotel_token');
  const savedUser = localStorage.getItem('hotel_user');

  return {
    user: savedUser ? JSON.parse(savedUser) : null,
    token: savedToken || null,
    isAuthenticated: !!savedToken,
    setAuth: (user, token) => {
      localStorage.setItem('hotel_token', token);
      localStorage.setItem('hotel_user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true });
    },
    logout: () => {
      localStorage.removeItem('hotel_token');
      localStorage.removeItem('hotel_user');
      set({ user: null, token: null, isAuthenticated: false });
    },
    hasRole: (roles) => {
      const u = get().user;
      if (!u) return false;
      if (u.rol === 'SUPER_ADMIN') return true;
      return roles.includes(u.rol);
    },
  };
});
