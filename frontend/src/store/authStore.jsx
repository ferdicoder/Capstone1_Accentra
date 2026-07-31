import { create } from 'zustand';

export const authStore = create((set) => ({
  user: null,
  role: null,
  loading: true,
  setAuth: (user, role) => set({ user, role, loading: false }),
  clearAuth: () => set({ user: null, role: null, loading: false }),
}));