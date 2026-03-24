import { create } from 'zustand';
import { Message, ChatState } from '../types';
import { messagesApi } from '../services/api';
import { messagesStorage } from '../services/storage';
import { authStorage } from '../services/storage';

interface ChatStore extends ChatState {
  fetchMessages: (page?: number, limit?: number) => Promise<void>;
  sendMessage: (
    content: string,
    messageType?: 'text' | 'voice'
  ) => Promise<void>;
  addMessage: (message: Message) => void;
  deleteMessage: (messageId: number) => Promise<void>;
  clearMessages: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  loadLocalMessages: () => Promise<void>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,

  fetchMessages: async (page: number = 1, limit: number = 50) => {
    const token = await authStorage.getToken();

    if (!token) {
      set({ isLoading: false, error: null }); // not authenticated yet — silent, don't block UI
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await messagesApi.getMessages(token, page, limit);

      if (response.success && response.data) {
        const messages = (response.data as any).messages as Message[];
        await messagesStorage.setMessages(messages);
        set({ messages, isLoading: false, error: null });
      } else {
        // Don't block UI on fetch failure — just clear loading
        set({ isLoading: false, error: null });
      }
    } catch (error: any) {
      set({ isLoading: false, error: null }); // silent fail — don't block the input bar
      console.error('[ChatStore] fetchMessages error:', error.message);
    }
  },

  sendMessage: async (
    content: string,
    messageType: 'text' | 'voice' = 'text'
  ) => {
    const token = await authStorage.getToken();

    if (!token) {
      set({ error: 'Not authenticated', isLoading: false });
      return;
    }

    // Add user message immediately — don't wait for API
    const optimisticUserMsg: Message = {
      id: Date.now(), // temp ID
      role: 'user',
      content,
      messageType,
      createdAt: new Date().toISOString(),
    };

    const currentMessages = get().messages;
    set({
      messages: [...currentMessages, optimisticUserMsg],
      isLoading: true,
      error: null,
    });

    try {
      const response = await messagesApi.sendMessage(
        token,
        content,
        messageType
      );

      if (response.success && response.data) {
        const assistantMessage = (response.data as any).message as Message;

        // Replace optimistic list + append real assistant response
        const withAssistant = [
          ...currentMessages,
          optimisticUserMsg,
          assistantMessage,
        ];
        await messagesStorage.setMessages(withAssistant);
        set({ messages: withAssistant, isLoading: false, error: null });
      } else {
        // Rollback optimistic message on failure
        set({
          messages: currentMessages,
          isLoading: false,
          error: response.error || 'Failed to send message',
        });
      }
    } catch (error: any) {
      // Rollback on network error
      set({
        messages: currentMessages,
        isLoading: false,
        error: error.message || 'Network error',
      });
      console.error('[ChatStore] sendMessage error:', error.message);
    }
  },

  addMessage: (message: Message) => {
    const currentMessages = get().messages;
    const updatedMessages = [...currentMessages, message];
    set({ messages: updatedMessages });
    messagesStorage.setMessages(updatedMessages).catch(console.error);
  },

  deleteMessage: async (messageId: number) => {
    const token = await authStorage.getToken();

    if (!token) {
      set({ error: 'Not authenticated' });
      return;
    }

    try {
      const response = await messagesApi.deleteMessages(token, [messageId]);

      if (response.success) {
        const updatedMessages = get().messages.filter(
          msg => msg.id !== messageId
        );
        await messagesStorage.setMessages(updatedMessages);
        set({ messages: updatedMessages, error: null });
      } else {
        set({ error: response.error || 'Failed to delete message' });
      }
    } catch (error: any) {
      set({
        error: error.message || 'An error occurred while deleting message',
      });
    }
  },

  clearMessages: () => {
    set({ messages: [], error: null });
    messagesStorage.clearMessages().catch(console.error);
  },

  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),

  loadLocalMessages: async () => {
    try {
      const localMessages = await messagesStorage.getMessages();
      if (localMessages.length > 0) {
        set({ messages: localMessages });
      }
    } catch (error) {
      console.error('[ChatStore] loadLocalMessages error:', error);
    }
  },
}));

export default useChatStore;
