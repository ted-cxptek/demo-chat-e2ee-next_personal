import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, LoginCredentials, RegisterCredentials, User } from '../types';
import { chatGatewayAPI, ApiError } from '../services/api';

interface AuthStore extends AuthState {
  errorMessage: string | null;
  successMessage: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  setError: (message: string | null) => void;
  clearError: () => void;
  setSuccess: (message: string | null) => void;
  clearSuccess: () => void;
  setValidationError: (message: string) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      errorMessage: null,
      successMessage: null,

      setLoading: (loading: boolean) => set({ isLoading: loading }),
      
      setError: (message: string | null) => set({ errorMessage: message }),
      
      clearError: () => set({ errorMessage: null }),

      setSuccess: (message: string | null) => set({ successMessage: message }),
      clearSuccess: () => set({ successMessage: null }),

      setValidationError: (message: string) => set({ errorMessage: message, isLoading: false }),

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, errorMessage: null });
        try {
          const response = await chatGatewayAPI.login(credentials);
          console.log("🚀 ~ response:", response)

          const { user, token } = response;
          if(!user || !token) {
            throw new Error('Login failed');
          }
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            errorMessage: null,
            successMessage: 'Login successful! Redirecting...',
          });
        } catch (error) {
          const fallbackMessage = error instanceof Error ? error.message : 'Login failed';
          set({ isLoading: false, errorMessage: fallbackMessage });
        }
      },

      register: async (credentials: RegisterCredentials) => {
        set({ isLoading: true, errorMessage: null });
        try {
          const response = await chatGatewayAPI.register(credentials);

          const { user, token } = response;
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            errorMessage: null,
            successMessage: 'Registration successful! Redirecting...',
          });
        } catch (error) {
          const fallbackMessage = error instanceof Error ? error.message : 'Registration failed';
          set({ isLoading: false, errorMessage: fallbackMessage });
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          errorMessage: null,
        });
      },

      updateUser: (user: User) => {
        set({ user });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
