import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api';

export interface User {
  id: string;
  email: string;
  nombre_completo: string;
  rol: string;
  condominio_id: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string) => void;
  logout: () => void;
  refreshAccessToken: () => Promise<string | null>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (user: User, accessToken: string) => {
        set({ user, accessToken, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, accessToken: null, isAuthenticated: false });
        // También llamar al endpoint de logout si existiera para borrar la cookie
      },

      refreshAccessToken: async () => {
        try {
          // El token de refresco viaja en la cookie automáticamente gracias a withCredentials: true
          const response = await api.post('/auth/refresh');
          const { accessToken } = response.data;
          set({ accessToken, isAuthenticated: true });
          return accessToken;
        } catch (error) {
          get().logout();
          return null;
        }
      },
    }),
    {
      name: 'nexia-auth', // key in local storage
      // Only store user info in local storage (accessToken can also be stored or kept in memory)
      partialize: (state) => ({ 
        user: state.user, 
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
