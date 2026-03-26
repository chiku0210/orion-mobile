import { create } from 'zustand';
import { Message, ChatState } from '../types';
import { messagesApi } from '../services/api';
import { messagesStorage } from '../services/storage';
import { authStorage } from '../services/storage';
import { BASE_URL } from '../utils/constants';

interface ChatStore extends ChatState {
  fetchMessages: (page?: number, limit?: number) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
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
  hasMore: boolean;
  isFetchingMore: boolean;
  currentOffset: number;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  hasMore: true,
  isFetchingMore: false,
  currentOffset: 0,

  fetchMessages: async (page: number = 1, limit: number = 50) => {
    const token = await authStorage.getToken();

    if (!token) {
      set({ isLoading: false, error: null });
      return;
    }

    set({ isLoading: true, error: null });

    try {
      const response = await messagesApi.getMessages(token, page, limit);

      if (response.success && response.data) {
        const messages = (response.data as any).messages as Message[];
        const pagination = (response.data as any).pagination;
        await messagesStorage.setMessages(messages);
        set({
          messages,
          isLoading: false,
          error: null,
          hasMore: pagination.hasMore,
          currentOffset: messages.length,
        });
      } else {
        set({ isLoading: false, error: null });
      }
    } catch (error: any) {
      set({ isLoading: false, error: null });
      console.error('[ChatStore] fetchMessages error:', error.message);
    }
  },

  loadMoreMessages: async () => {
    const { isFetchingMore, hasMore, messages, currentOffset } = get();
    if (isFetchingMore || !hasMore) return;

    const token = await authStorage.getToken();
    if (!token) return;

    set({ isFetchingMore: true });
    const limit = 50;

    try {
      const res = await fetch(
        `${BASE_URL}/api/chat/history?limit=${limit}&offset=${currentOffset}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      const older = data.messages as Message[];
      const pagination = data.pagination;

      // Older messages go to END of array — inverted FlatList renders end at top
      const merged = [...messages, ...older];
      await messagesStorage.setMessages(merged);
      set({
        messages: merged,
        isFetchingMore: false,
        hasMore: pagination.hasMore,
        currentOffset: currentOffset + older.length,
      });
    } catch (err: any) {
      set({ isFetchingMore: false });
      console.error('[ChatStore] loadMoreMessages error:', err.message);
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

    const optimisticUserMsg: Message = {
      id: Date.now(),
      role: 'user',
      content,
      messageType,
      createdAt: new Date().toISOString(),
    };

    const currentMessages = get().messages;
    set({
      messages: [optimisticUserMsg, ...currentMessages],
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

        const withAssistant = [
          assistantMessage,
          optimisticUserMsg,
          ...currentMessages,
        ];
        await messagesStorage.setMessages(withAssistant);
        // New messages sent — bump offset by 2 (user + assistant)
        set({
          messages: withAssistant,
          isLoading: false,
          error: null,
          currentOffset: get().currentOffset + 2,
        });
      } else {
        set({
          messages: currentMessages,
          isLoading: false,
          error: response.error || 'Failed to send message',
        });
      }
    } catch (error: any) {
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
    const updatedMessages = [message, ...currentMessages];
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
    set({ messages: [], error: null, hasMore: true, currentOffset: 0 });
    messagesStorage.clearMessages().catch(console.error);
  },

  setLoading: (loading: boolean) => set({ isLoading: loading }),
  setError: (error: string | null) => set({ error }),

  loadLocalMessages: async () => {
    try {
      const localMessages = await messagesStorage.getMessages();
      if (localMessages.length > 0) {
        set({ messages: localMessages, currentOffset: localMessages.length });
      }
    } catch (error) {
      console.error('[ChatStore] loadLocalMessages error:', error);
    }
  },
}));

export default useChatStore;
