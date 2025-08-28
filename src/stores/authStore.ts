import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, LoginCredentials, RegisterFormData, User } from '../types';
import { chatAPI, ApiError } from '../services/api';
import { generateUserKeys, derivePublicKeyFromPrivateKey } from '../utils/crypto';

interface AuthStore extends AuthState {
  errorMessage: string | null;
  successMessage: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (formData: RegisterFormData) => Promise<void>;
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
          const response = await chatAPI.login(credentials);

          const { user, token } = response;
          if(!user || !token) {
            throw new Error('Login failed');
          }
          
          // Use the private key provided in credentials for decryption
          if (!credentials.privateKey) {
            throw new Error('Private key is required for login.');
          }
          
          // Derive public key from private key
          let derivedPublicKey: string;
          try {
            derivedPublicKey = derivePublicKeyFromPrivateKey(credentials.privateKey);
          } catch (error) {
            throw new Error(`Invalid private key: ${error instanceof Error ? error.message : 'Failed to derive public key'}`);
          }
          
          // Update user object with private key and derived public key
          const enhancedUser = {
            ...user,
            privateKey: credentials.privateKey,
            publicKey: derivedPublicKey, // Use derived public key instead of API response
          };
          
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

      register: async (formData: RegisterFormData) => {
        set({ isLoading: true, errorMessage: null });
        try {
          // Generate ECC keypair for the user
          const { privateKeyHex, publicKeyHex } = await generateUserKeys();
          
          // Create enhanced credentials with generated public key
          const enhancedCredentials = {
            username: formData.username,
            password: formData.password,
            publicKey: publicKeyHex,
          };
          
          const response = await chatAPI.register(enhancedCredentials);

          const { user, token } = response;
          
          // Create enhanced user object with the GENERATED private key and public key
          // NOT the API response data, since we want to store our generated crypto data
          const enhancedUser: User = {
            id: response.user.id,
            username: response.user.username,
            publicKey: publicKeyHex,        // Use GENERATED public key, not API response
            privateKey: privateKeyHex,      // Store GENERATED private key locally
            createdAt: response.user.createdAt,
          };
          
          set({
            user: enhancedUser,
            token,
            isAuthenticated: true,
            isLoading: false,
            errorMessage: null,
            successMessage: 'Registration successful! Redirecting...',
          });
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
