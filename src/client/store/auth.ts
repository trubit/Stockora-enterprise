import { create } from 'zustand';
import type { User } from '../../shared/types.js';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (user: User, accessToken: string, refreshToken: string) => void;
  clearSession: () => void;
  updateUser: (user: Partial<User>) => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: typeof window !== 'undefined' ? localStorage.getItem('stockora_token') : null,
  refreshToken: typeof window !== 'undefined' ? localStorage.getItem('stockora_refresh_token') : null,
  setSession: (user, accessToken, refreshToken) => {
    localStorage.setItem('stockora_token', accessToken);
    localStorage.setItem('stockora_refresh_token', refreshToken);
    set({ user, accessToken, refreshToken });
  },
  clearSession: () => {
    localStorage.removeItem('stockora_token');
    localStorage.removeItem('stockora_refresh_token');
    set({ user: null, accessToken: null, refreshToken: null });
  },
  updateUser: (updatedFields) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updatedFields } : null,
    })),
  setUser: (user) => set({ user }),
}));
