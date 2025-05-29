import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, User, LoginRequest, RegisterRequest } from '@/types';
import apiService from '@/lib/api';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user: User, token: string) => {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
      },

      login: async (credentials: LoginRequest) => {
        try {
          const response = await apiService.login(credentials);
          const user: User = {
            id: response.userId,
            username: response.username,
          };
          get().setAuth(user, response.token);
        } catch (error: any) {
          throw new Error(error.response?.data?.error || 'Login failed');
        }
      },

      register: async (credentials: RegisterRequest) => {
        try {
          const response = await apiService.register(credentials);
          const user: User = {
            id: response.userId,
            username: response.username,
          };
          get().setAuth(user, response.token);
        } catch (error: any) {
          throw new Error(error.response?.data?.error || 'Registration failed');
        }
      },

      logout: () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
); 