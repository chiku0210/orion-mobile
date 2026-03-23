import { User, Message } from '../types';
import { BASE_URL, API_TIMEOUT } from '../utils/constants';

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

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'An error occurred',  // backend returns { error: "..." }
      };
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
  login: async (email: string, password: string): Promise<ApiResponse<AuthResponse>> => {
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

  sendMessage: async (
    token: string,
    content: string,
    messageType: 'text' | 'voice' = 'text'
  ): Promise<ApiResponse<SendMessageResponse>> => {
    return fetchApi<SendMessageResponse>('/api/chat/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      // Backend expects { text, type } not { content, messageType }
      body: JSON.stringify({ text: content, type: messageType }),
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
};

// User API — not implemented in backend yet, placeholder
export const userApi = {
  getProfile: async (token: string): Promise<ApiResponse<User>> => {
    return fetchApi<User>('/api/user/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

export default {
  auth: authApi,
  messages: messagesApi,
  user: userApi,
};
