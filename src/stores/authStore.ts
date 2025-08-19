import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, LoginCredentials, RegisterCredentials, User } from '../types';
import { chatGatewayAPI, ApiError } from '../services/api';
import { derivePublicKeyFromSeedPhrase, generateSeedPhraseAndPublicKey } from '../utils/crypto';

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

          const { user, token } = response;
          if(!user || !token) {
            throw new Error('Login failed');
          }
          
          // Use the provided seed phrase from login credentials
          const { seedPhrase } = credentials;
          
          // Update user object with crypto data
          // For login, we derive the public key from the provided seed phrase
          // This should match what was stored during registration
          const enhancedUser = seedPhrase ? {
            ...user,
            seedPhrase: seedPhrase,
            publicKey: derivePublicKeyFromSeedPhrase(seedPhrase),
          } : user;
          
          
          set({
            user: enhancedUser,
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
          // Generate seed phrase and derive public key for the user
          const { seedPhrase, publicKey } = generateSeedPhraseAndPublicKey();
          
          // Create enhanced credentials with crypto data
          const enhancedCredentials = {
            ...credentials,
            seedPhrase,
            publicKey,
          };
          
          const response = await chatGatewayAPI.register(enhancedCredentials);

          const { user, token } = response;
          
          // Create enhanced user object with the GENERATED seed phrase and public key
          // NOT the API response data, since we want to store our generated crypto data
          const enhancedUser: User = {
            id: response.user.id,
            username: response.user.username,
            publicKey: publicKey,        // Use GENERATED public key, not API response
            createdAt: response.user.createdAt,
            seedPhrase: seedPhrase,      // Use GENERATED seed phrase, not credentials
          };
          
          console.log('🔐 Registration - Enhanced user object:', {
            id: enhancedUser.id,
            username: enhancedUser.username,
            hasSeedPhrase: !!enhancedUser.seedPhrase,
            hasPublicKey: !!enhancedUser.publicKey,
            seedPhrasePreview: enhancedUser.seedPhrase?.substring(0, 20) + '...',
            publicKeyPreview: enhancedUser.publicKey?.substring(0, 20) + '...'
          });
          
          set({
            user: enhancedUser,
            token,
            isAuthenticated: true,
            isLoading: false,
            errorMessage: null,
            successMessage: 'Registration successful! Redirecting...',
          });
          
          console.log('🔐 Registration - User data saved to store successfully');
        } catch (error) {
          if (error instanceof ApiError) {
            // Handle ApiError specifically
            if ('code' in error) {
              const apiError = error as any;
              let errorMessage = 'Registration failed';
              
              if (apiError.code === 'username_taken') {
                errorMessage = 'Username is already taken. Please choose a different username.';
              } else if (apiError.code === 'weak_password') {
                errorMessage = 'Password is too weak. Please choose a stronger password.';
              } else if (apiError.code === 'invalid_username') {
                errorMessage = 'Username contains invalid characters. Please use only letters, numbers, and underscores.';
              } else if (apiError.code === 'email_invalid') {
                errorMessage = 'Please provide a valid email address.';
              } else {
                errorMessage = apiError.message || 'Registration failed. Please try again.';
              }
              
              set({ errorMessage, isLoading: false });
              throw error;
            } else {
              set({ errorMessage: error.message, isLoading: false });
              throw error;
            }
          }
          
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
