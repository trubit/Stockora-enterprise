import { create } from 'zustand';
import type { User } from '../../shared/types.js';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setSession: (user: User, accessToken: string, refreshToken?: string) => void;
  clearSession: () => void;
  updateUser: (user: Partial<User>) => void;
  setUser: (user: User | null) => void;
}

const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('stockora_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getStoredUser(),
  accessToken: typeof window !== 'undefined' ? localStorage.getItem('stockora_token') : null,
  refreshToken:
    typeof window !== 'undefined' ? localStorage.getItem('stockora_refresh_token') : null,
  setSession: (user, accessToken, refreshToken) => {
    localStorage.setItem('stockora_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('stockora_refresh_token', refreshToken);
    }
    if (user) {
      localStorage.setItem('stockora_user', JSON.stringify(user));
    }
    set({
      user,
      accessToken,
      ...(refreshToken !== undefined ? { refreshToken } : {}),
    });
  },
  clearSession: () => {
    localStorage.removeItem('stockora_token');
    localStorage.removeItem('stockora_refresh_token');
    localStorage.removeItem('stockora_user');
    localStorage.removeItem('stockora_active_tenant_id');
    localStorage.removeItem('stockora_active_tenant_slug');
    try {
      import('./tenant.js')
        .then((m) => m.useTenantStore.getState().clearTenantState())
        .catch(() => {});
    } catch {}
    set({ user: null, accessToken: null, refreshToken: null });
  },
  updateUser: (updatedFields) =>
    set((state) => {
      const updated = state.user ? { ...state.user, ...updatedFields } : null;
      if (updated && typeof window !== 'undefined') {
        localStorage.setItem('stockora_user', JSON.stringify(updated));
      }
      return { user: updated };
    }),
  setUser: (user) => {
    if (user && typeof window !== 'undefined') {
      localStorage.setItem('stockora_user', JSON.stringify(user));
    } else if (!user && typeof window !== 'undefined') {
      localStorage.removeItem('stockora_user');
    }
    set({ user });
  },
}));
