import { create } from 'zustand';
import { User, AuthResponse } from '../types';
import { authApi } from '../api/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  initialize: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  initialize: () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      const user = JSON.parse(userStr);
      set({ user, token, isAuthenticated: true });
    }
  },

  login: async (email: string, password: string) => {
    const response: AuthResponse = await authApi.login({ email, password });
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    set({
      user: response.user,
      token: response.token,
      isAuthenticated: true,
    });
  },

  register: async (email: string, password: string, name: string) => {
    const response: AuthResponse = await authApi.register({
      email,
      password,
      name,
    });
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    set({
      user: response.user,
      token: response.token,
      isAuthenticated: true,
    });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
