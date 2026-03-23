export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  messageType?: 'text' | 'voice';    // frontend-created messages
  message_type?: 'text' | 'voice';   // backend responses (snake_case)
  createdAt?: string;                 // frontend
  created_at?: string;                // backend
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}
