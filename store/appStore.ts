import { create } from 'zustand';

interface User {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  balance: number;
  tier: 'user' | 'agent';
  role: 'USER' | 'AGENT' | 'ADMIN';
}

interface AppStore {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null }),
}));
