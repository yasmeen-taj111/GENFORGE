import { create } from 'zustand';
import api, { getErrorMessage } from '../lib/api';

const API_URL = '/auth';

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,

  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
      set({ token, isAuthenticated: true });
    } else {
      localStorage.removeItem('token');
      set({ token: null, isAuthenticated: false, user: null });
    }
  },

  register: async (name, email, password, confirmPassword) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post(`${API_URL}/register`, { name, email, password, confirmPassword });
      const { token, ...userData } = res.data;
      get().setToken(token);
      set({ user: userData, loading: false });
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err, 'Registration failed'), loading: false });
      return false;
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post(`${API_URL}/login`, { email, password });
      const { token, ...userData } = res.data;
      get().setToken(token);
      set({ user: userData, loading: false });
      return true;
    } catch (err) {
      set({ error: getErrorMessage(err, 'Login failed'), loading: false });
      return false;
    }
  },

  logout: () => {
    get().setToken(null);
  },

  checkAuth: async () => {
    const token = get().token;
    if (!token) return;
    set({ loading: true });
    try {
      const res = await api.get(`${API_URL}/me`);
      set({ user: res.data, isAuthenticated: true, loading: false });
    } catch {
      get().setToken(null);
      set({ loading: false });
    }
  },

  clearError: () => set({ error: null })
}));

export default useAuthStore;
