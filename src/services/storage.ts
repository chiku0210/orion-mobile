import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@orion_auth_token',
  REFRESH_TOKEN: '@orion_refresh_token',
  USER_DATA: '@orion_user_data',
  MESSAGES: '@orion_messages',
  SETTINGS: '@orion_settings',
} as const;

// Generic storage functions
export const storage = {
  // Set a string value
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error setting item ${key}:`, error);
      throw error;
    }
  },

  // Get a string value
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return null;
    }
  },

  // Remove an item
  removeItem: async (key: string): Promise<void> => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
      throw error;
    }
  },

  // Set an object (JSON stringified)
  setObject: async <T>(key: string, value: T): Promise<void> => {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Error setting object ${key}:`, error);
      throw error;
    }
  },

  // Get an object (JSON parsed)
  getObject: async <T>(key: string): Promise<T | null> => {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error(`Error getting object ${key}:`, error);
      return null;
    }
  },

  // Clear all storage
  clear: async (): Promise<void> => {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  },

  // Get all keys
  getAllKeys: async (): Promise<readonly string[]> => {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  },

  // Multi-get (get multiple values at once)
  multiGet: async (
    keys: readonly string[]
  ): Promise<[string, string | null][]> => {
    try {
      const result = await AsyncStorage.multiGet([...keys]);
      return result as [string, string | null][];
    } catch (error) {
      console.error('Error multi-get:', error);
      return keys.map(key => [key, null]);
    }
  },

  // Multi-set (set multiple values at once)
  multiSet: async (
    keyValuePairs: readonly (readonly [string, string])[]
  ): Promise<void> => {
    try {
      await AsyncStorage.multiSet([...keyValuePairs]);
    } catch (error) {
      console.error('Error multi-set:', error);
      throw error;
    }
  },
};

// Auth-specific storage functions
export const authStorage = {
  // Save auth token
  setToken: async (token: string): Promise<void> => {
    await storage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  },

  // Get auth token
  getToken: async (): Promise<string | null> => {
    return await storage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  // Save refresh token
  setRefreshToken: async (token: string): Promise<void> => {
    await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  },

  // Get refresh token
  getRefreshToken: async (): Promise<string | null> => {
    return await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  // Save user data
  setUser: async (user: User): Promise<void> => {
    await storage.setObject(STORAGE_KEYS.USER_DATA, user);
  },

  // Get user data
  getUser: async (): Promise<User | null> => {
    return await storage.getObject(STORAGE_KEYS.USER_DATA);
  },

  // Clear all auth data
  clearAuth: async (): Promise<void> => {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER_DATA,
    ]);
  },

  // Check if user is logged in
  isLoggedIn: async (): Promise<boolean> => {
    const token = await storage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    return token !== null;
  },
};

// Messages-specific storage functions
export const messagesStorage = {
  // Save messages to local storage
  setMessages: async (messages: any[]): Promise<void> => {
    await storage.setObject(STORAGE_KEYS.MESSAGES, messages);
  },

  // Get messages from local storage
  getMessages: async (): Promise<any[]> => {
    const messages = await storage.getObject<any[]>(STORAGE_KEYS.MESSAGES);
    return messages || [];
  },

  // Clear messages
  clearMessages: async (): Promise<void> => {
    await storage.removeItem(STORAGE_KEYS.MESSAGES);
  },
};

export default storage;
