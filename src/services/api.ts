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
  total: number;
  page: number;
  limit: number;
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
        error: data.message || 'An error occurred',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'Request timed out',
      };
    }
    return {
      success: false,
      error: error.message || 'Network error',
    };
  }
}

// Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse<AuthResponse>> => {
    return fetchApi<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register: async (
    username: string,
    email: string,
    password: string
  ): Promise<ApiResponse<AuthResponse>> => {
    return fetchApi<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
  },

  logout: async (token: string): Promise<ApiResponse<null>> => {
    return fetchApi<null>('/auth/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  refreshToken: async (token: string): Promise<ApiResponse<{ token: string }>> => {
    return fetchApi<{ token: string }>('/auth/refresh', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

// Messages API
export const messagesApi = {
  getMessages: async (
    token: string,
    page: number = 1,
    limit: number = 50
  ): Promise<ApiResponse<MessagesResponse>> => {
    return fetchApi<MessagesResponse>(
      `/messages?page=${page}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },

  sendMessage: async (
    token: string,
    content: string,
    messageType: 'text' | 'voice' = 'text'
  ): Promise<ApiResponse<Message>> => {
    return fetchApi<Message>('/messages', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content, messageType }),
    });
  },

  deleteMessage: async (
    token: string,
    messageId: number
  ): Promise<ApiResponse<null>> => {
    return fetchApi<null>(`/messages/${messageId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

// User API
export const userApi = {
  getProfile: async (token: string): Promise<ApiResponse<User>> => {
    return fetchApi<User>('/users/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  updateProfile: async (
    token: string,
    data: Partial<User>
  ): Promise<ApiResponse<User>> => {
    return fetchApi<User>('/users/profile', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  },

  updatePassword: async (
    token: string,
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse<null>> => {
    return fetchApi<null>('/users/password', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};

export default {
  auth: authApi,
  messages: messagesApi,
  user: userApi,
};
