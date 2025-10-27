import { create } from 'zustand';
import { User } from '../types';

type AuthStore = {
  token: string | null;
  user: User | null;
  setAuth: (token: string | null, user: User | null) => void;
  logout: () => void;
}

const getStoredAuth = () => {
  try {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  ...getStoredAuth(),
  setAuth: (token, user) => {
    // Log to help diagnose unexpected repeated calls
    // eslint-disable-next-line no-console
    console.log('[auth] setAuth called', { token, user });

    const current = get();
    // Avoid updating store if values didn't change
    const sameToken = current.token === token;
    const sameUser = JSON.stringify(current.user) === JSON.stringify(user);
    if (sameToken && sameUser) return;

    if (token && user) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    set({ token, user });
  },
  logout: () => {
    // eslint-disable-next-line no-console
    console.log('[auth] logout called');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    const current = get();
    if (current.token === null && current.user === null) return;
    set({ token: null, user: null });
  }
}));