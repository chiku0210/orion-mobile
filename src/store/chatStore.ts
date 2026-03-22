import { create } from 'zustand';
import { Message, ChatState } from '../types';
import { messagesApi } from '../services/api';
import { messagesStorage } from '../services/storage';
import { authStorage } from '../services/storage';

interface ChatStore extends ChatState {
  // Actions
  fetchMessages: (page?: number, limit?: number) => Promise<void>;
  sendMessage: (content: string, messageType?: 'text' | 'voice') => Promise<void>;
  addMessage: (message: Message) => void;
  deleteMessage: (messageId: number) => Promise<void>;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  loadLocalMessages: () => Promise<void>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state
  messages: [],
  isLoading: false,
  error: null,

  // Fetch messages from API
  fetchMessages: async (page: number = 1, limit: number = 50) => {
    const token = await authStorage.getToken();
    
    if (!token) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await messagesApi.getMessages(token, page, limit);

      if (response.success && response.data) {
        const { messages } = response.data;
        
        // Save to local storage
        await messagesStorage.setMessages(messages);
        
        set({
          messages,
          isLoading: false,
          error: null,
        });
      } else {
        set({
          isLoading: false,
          error: response.error || 'Failed to fetch messages',
        });
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'An error occurred while fetching messages',
      });
    }
  },

  // Send a new message
  sendMessage: async (content: string, messageType: 'text' | 'voice' = 'text') => {
    const token = await authStorage.getToken();
    
    if (!token) {
      set({ error: 'Not authenticated' });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await messagesApi.sendMessage(token, content, messageType);

      if (response.success && response.data) {
        const newMessage = response.data;
        
        // Add to local messages
        const currentMessages = get().messages;
        const updatedMessages = [...currentMessages, newMessage];
        
        // Save to local storage
        await messagesStorage.setMessages(updatedMessages);
        
        set({
          messages: updatedMessages,
          isLoading: false,
          error: null,
        });
      } else {
        set({
          isLoading: false,
          error: response.error || 'Failed to send message',
        });
      }
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.message || 'An error occurred while sending message',
      });
    }
  },

  // Add a message directly (for optimistic updates)
  addMessage: (message: Message) => {
    const currentMessages = get().messages;
    const updatedMessages = [...currentMessages, message];
    
    set({ messages: updatedMessages });
    
    // Save to local storage
    messagesStorage.setMessages(updatedMessages).catch(console.error);
  },

  // Delete a message
  deleteMessage: async (messageId: number) => {
    const token = await authStorage.getToken();
    
    if (!token) {
      set({ error: 'Not authenticated' });
      return;
    }

    try {
      const response = await messagesApi.deleteMessage(token, messageId);

      if (response.success) {
        const currentMessages = get().messages;
        const updatedMessages = currentMessages.filter((msg) => msg.id !== messageId);
        
        // Save to local storage
        await messagesStorage.setMessages(updatedMessages);
        
        set({
          messages: updatedMessages,
          error: null,
        });
      } else {
        set({
          error: response.error || 'Failed to delete message',
        });
      }
    } catch (error: any) {
      set({
        error: error.message || 'An error occurred while deleting message',
      });
    }
  },

  // Clear all messages
  clearMessages: () => {
    set({ messages: [], error: null });
    messagesStorage.clearMessages().catch(console.error);
  },

  // Set loading state
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  // Set error
  setError: (error: string | null) => {
    set({ error });
  },

  // Load messages from local storage
  loadLocalMessages: async () => {
    try {
      const localMessages = await messagesStorage.getMessages();
      if (localMessages.length > 0) {
        set({ messages: localMessages });
      }
    } catch (error) {
      console.error('Error loading local messages:', error);
    }
  },
}));

export default useChatStore;
