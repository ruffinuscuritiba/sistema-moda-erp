import { create } from 'zustand';
import Cookies from 'js-cookie';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'SELLER' | 'CASHIER';
}

export interface AuthCompany {
  id: string;
  name: string;
  slug: string;
  segment: 'BRECHO' | 'DEPARTAMENTO' | 'MODA';
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  company: AuthCompany | null;
  isHydrated: boolean;
  setAuth: (token: string, user: AuthUser, company: AuthCompany) => void;
  hydrate: () => void;
  logout: () => void;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  company: null,
  isHydrated: false,

  setAuth: (token, user, company) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('company', JSON.stringify(company));
    Cookies.set('token', token, { expires: 7 });
    set({ token, user, company });
  },

  hydrate: () => {
    if (typeof window === 'undefined' || get().isHydrated) return;
    const token = localStorage.getItem('token');
    const userRaw = localStorage.getItem('user');
    const companyRaw = localStorage.getItem('company');
    set({
      token,
      user: userRaw ? JSON.parse(userRaw) : null,
      company: companyRaw ? JSON.parse(companyRaw) : null,
      isHydrated: true,
    });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('company');
    Cookies.remove('token');
    set({ token: null, user: null, company: null });
  },

  isAdmin: () => get().user?.role === 'ADMIN' || get().user?.role === 'MANAGER',
}));
