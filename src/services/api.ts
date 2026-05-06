import { Platform } from 'react-native';
import { User, Message } from '../types';
import { BASE_URL, API_TIMEOUT } from '../utils/constants';
import { authStorage } from './storage';

// Response types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

interface MessagesResponse {
  messages: Message[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface SendMessageResponse {
  message: Message;
  metadata: {
    tokensUsed: number;
    processingTime: number;
    model: string;
  };
}

// Logout callback — set by authStore on init to avoid circular imports
let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (handler: () => void) => {
  onUnauthorized = handler;
};

// Helper function for making API requests
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    // Token expired or invalid — trigger auto-logout
    if (response.status === 401 || response.status === 403) {
      await authStorage.clearAuth();
      onUnauthorized?.();
      return { success: false, error: 'Session expired. Please log in again.' };
    }

    const contentType = response.headers.get('content-type');
    let data: any;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      return { 
        success: false, 
        error: !response.ok ? `Server error (${response.status}): ${text.substring(0, 100)}` : 'Invalid response format'
      };
    }

    if (!response.ok) {
      return { success: false, error: data.error || 'An error occurred' };
    }

    return { success: true, data };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { success: false, error: 'Request timed out' };
    }
    return { success: false, error: error.message || 'Network error' };
  }
}

// Auth API — paths: /api/auth/*
export const authApi = {
  login: async (
    email: string,
    password: string
  ): Promise<ApiResponse<AuthResponse>> => {
    return fetchApi<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register: async (
    username: string,
    email: string,
    password: string
  ): Promise<ApiResponse<AuthResponse>> => {
    return fetchApi<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  },

  logout: async (_token: string): Promise<ApiResponse<null>> => {
    // No backend logout endpoint — just clear local state
    return { success: true };
  },
};

// Messages API — paths: /api/chat/*
export const messagesApi = {
  getMessages: async (
    token: string,
    page: number = 1,
    limit: number = 50
  ): Promise<ApiResponse<MessagesResponse>> => {
    const offset = (page - 1) * limit;
    return fetchApi<MessagesResponse>(
      `/api/chat/history?limit=${limit}&offset=${offset}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  },

  searchMessages: async (
    token: string,
    query: string
  ): Promise<ApiResponse<{ messages: Message[] }>> => {
    return fetchApi<{ messages: Message[] }>(
      `/api/chat/search?q=${encodeURIComponent(query)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  },

  sendMessage: async (
    token: string,
    content: string,
    messageType: 'text' | 'voice' = 'text'
  ): Promise<ApiResponse<SendMessageResponse>> => {
    return fetchApi<SendMessageResponse>('/api/chat/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      // Backend expects { text, type } not { content, messageType }
      body: JSON.stringify({ text: content, type: messageType, stream: false }),
    });
  },

  streamMessage: async (
    token: string,
    content: string,
    onToken: (token: string) => void,
    onDone: (data: any) => void,
    onError: (error: string) => void,
    messageType: 'text' | 'voice' = 'text'
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${BASE_URL}/api/chat/send`);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      let lastIndex = 0;

      xhr.onreadystatechange = () => {
        // readyState 3: Loading (partial data received)
        // readyState 4: Done
        if (xhr.readyState === 3 || xhr.readyState === 4) {
          const newData = xhr.responseText.substring(lastIndex);
          const lines = newData.split('\n');
          
          // Save the last potentially incomplete line if we're still loading
          if (xhr.readyState === 3) {
            const lastLine = lines.pop() || '';
            lastIndex = xhr.responseText.length - lastLine.length;
          } else {
            lastIndex = xhr.responseText.length;
          }

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('data: ')) {
              try {
                const data = JSON.parse(trimmedLine.slice(6));
                if (data.token) {
                  onToken(data.token);
                }
                if (data.done) {
                  onDone(data);
                }
                if (data.error) {
                  onError(data.error);
                }
              } catch (e) {
                // Partial JSON, ignore until next chunk
              }
            }
          }
        }

        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            const errorMsg = `Server error: ${xhr.status}`;
            onError(errorMsg);
            reject(new Error(errorMsg));
          }
        }
      };

      xhr.onerror = () => {
        onError('Network error');
        reject(new Error('Network error'));
      };

      xhr.send(JSON.stringify({ text: content, type: messageType, stream: true }));
    });
  },

  deleteMessages: async (
    token: string,
    messageIds: number[]
  ): Promise<ApiResponse<null>> => {
    return fetchApi<null>('/api/chat/delete', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ messageIds }),
    });
  },

  transcribe: async (
    token: string,
    audioUri: string
  ): Promise<ApiResponse<{ text: string }>> => {
    try {
      const formData = new FormData();
      
      // Sanitize the URI:
      // 1. Remove any existing file:// or file:/ prefixes
      // 2. Prepend exactly file:/// for a proper absolute path URI
      let cleanUri = audioUri.replace(/^file:\/+/ , '');
      if (!cleanUri.startsWith('/')) {
        cleanUri = '/' + cleanUri;
      }
      const normalizedUri = `file://${cleanUri}`;

      console.log('[messagesApi] Transcribing normalized URI:', normalizedUri);

      const fileData = {
        uri: normalizedUri,
        type: 'audio/mp4', // Official MIME type for .m4a
        name: 'speech.m4a',
      };

      // @ts-ignore - RN FormData requires this specific object structure
      formData.append('audio', fileData);

      const response = await fetch(`${BASE_URL}/api/chat/transcribe`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      console.log('[messagesApi] Transcribe status:', response.status);
      const data = await response.json();
      if (!response.ok) {
        console.error('[messagesApi] Transcribe failed:', data.error);
        return { success: false, error: data.error || 'Transcription failed' };
      }
      return { success: true, data };
    } catch (error: any) {
      console.error('[messagesApi] Transcribe network error:', error);
      return { success: false, error: error.message || 'Network error' };
    }
  },
};

export const userApi = {
  getProfile: async (token: string): Promise<ApiResponse<User>> => {
    return fetchApi<User>('/api/user/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

export default { auth: authApi, messages: messagesApi, user: userApi };
