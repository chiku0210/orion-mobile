import { create } from 'zustand';
import { User, AuthState } from '../types';
import { authStorage } from '../services/storage';
import { authApi } from '../services/api';

interface AuthStore extends AuthState {
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  clearError: () => void;
  error: string | null;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Login action
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await authApi.login(email, password);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // Save to storage
        await authStorage.setToken(token);
        await authStorage.setUser(user);
        
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        set({
          isLoading: false,
          error: response.error || 'Login failed',
        });
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'An error occurred during login',
      });
    }
  },

  // Register action
  register: async (username: string, email: string, password: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await authApi.register(username, email, password);
      
      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // Save to storage
        await authStorage.setToken(token);
        await authStorage.setUser(user);
        
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        set({
          isLoading: false,
          error: response.error || 'Registration failed',
        });
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'An error occurred during registration',
      });
    }
  },

  // Logout action
  logout: async () => {
    set({ isLoading: true });
    
    try {
      const currentToken = get().token;
      if (currentToken) {
        await authApi.logout(currentToken);
      }
    } catch (error) {
      // Ignore logout errors
      console.error('Logout error:', error);
    } finally {
      // Clear storage and state
      await authStorage.clearAuth();
      
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  // Check auth status on app start
  checkAuth: async () => {
    set({ isLoading: true });
    
    try {
      const token = await authStorage.getToken();
      const user = await authStorage.getUser();
      
      if (token && user) {
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          isLoading: false,
          isAuthenticated: false,
        });
      }
    } catch (error) {
      set({
        isLoading: false,
        isAuthenticated: false,
      });
    }
  },

  // Set user directly
  setUser: (user: User | null) => {
    set({ user });
  },

  // Set token directly
  setToken: (token: string | null) => {
    set({ token });
  },

  // Set loading state
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));

export default useAuthStore;
