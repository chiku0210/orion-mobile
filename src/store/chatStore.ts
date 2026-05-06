import { create } from 'zustand';
import { Message, ChatState } from '../types';
import { messagesApi } from '../services/api';
import { messagesStorage } from '../services/storage';
import { authStorage } from '../services/storage';
import { ttsService } from '../services/ttsService';

interface ChatStore extends ChatState {
  isRecording: boolean;
  setIsRecording: (isRecording: boolean) => void;
  isProcessingVoice: boolean;
  setIsProcessingVoice: (isProcessing: boolean) => void;
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
  isRecording: false,
  isProcessingVoice: false,
  error: null,
  hasMore: true,
  isFetchingMore: false,
  currentOffset: 0,

  setIsRecording: (isRecording: boolean) => set({ isRecording }),
  setIsProcessingVoice: (isProcessingVoice: boolean) => set({ isProcessingVoice }),

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
        // Don't block UI on fetch failure — just clear loading
        set({ isLoading: false, error: null });
      }
    } catch (error: any) {
      set({ isLoading: false, error: null }); // silent fail — don't block the input bar
      console.error('[ChatStore] fetchMessages error:', error.message);
    }
  },

  loadMoreMessages: async () => {
    const { isFetchingMore, hasMore, currentOffset } = get();
    if (isFetchingMore || !hasMore) {return;}

    const token = await authStorage.getToken();
    if (!token) {return;}

    set({ isFetchingMore: true });
    const limit = 50;
    // Calculate page number based on current offset (API calculates offset as (page - 1) * limit)
    const page = Math.floor(currentOffset / limit) + 1;

    try {
      const response = await messagesApi.getMessages(token, page, limit);

      if (response.success && response.data) {
        const older = (response.data as any).messages as Message[];
        const pagination = (response.data as any).pagination;
        const currentMessages = get().messages;

        // Older messages go to END of array — inverted FlatList renders end at top
        const merged = [...currentMessages, ...older];
        await messagesStorage.setMessages(merged);
        set({
          messages: merged,
          isFetchingMore: false,
          hasMore: pagination.hasMore,
          currentOffset: currentOffset + older.length,
        });
      } else {
        set({ isFetchingMore: false });
      }
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

    const currentMessages = get().messages;

    // 1. Add user message optimistically
    const userMsg: Message = {
      id: Date.now(), // temp ID
      role: 'user',
      content,
      messageType,
      createdAt: new Date().toISOString(),
    };

    set({
      messages: [userMsg, ...currentMessages],
      isLoading: true,
      error: null,
    });

    let hasCreatedAssistantMsg = false;
    const assistantMsgId = Date.now() + 1;

    try {
      await messagesApi.streamMessage(
        token,
        content,
        (tokenStr) => {
          // Callback for each token
          set((state) => {
            if (!hasCreatedAssistantMsg) {
              hasCreatedAssistantMsg = true;
              // Create and prepend assistant message on first token
              const assistantMsg: Message = {
                id: assistantMsgId,
                role: 'assistant',
                content: tokenStr,
                messageType: 'text',
                createdAt: new Date().toISOString(),
              };
              return { messages: [assistantMsg, ...state.messages] };
            }

            // Update existing message
            return {
              messages: state.messages.map((m) =>
                m.id === assistantMsgId ? { ...m, content: m.content + tokenStr } : m
              ),
            };
          });
        },
        async (doneData) => {
          // Callback when stream is finished
          console.log('[ChatStore] Stream finished. Message ID:', doneData.messageId);
          set((state) => ({
            messages: state.messages.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    id: doneData.messageId,
                    createdAt: doneData.createdAt,
                  }
                : m
            ),
            isLoading: false,
          }));

          // Trigger TTS for the assistant's response
          const updatedMessages = get().messages;
          const assistantMessage = updatedMessages.find(m => m.id === doneData.messageId);
          if (assistantMessage) {
            await ttsService.init();
            ttsService.speak(assistantMessage.content);
          }

          // Persist the full updated list to storage
          await messagesStorage.setMessages(get().messages);

          // Update offset for new messages added
          set((state) => ({
            currentOffset: state.currentOffset + 2, // user + assistant
          }));
        },
        (errorStr) => {
          // Callback on error
          set({ error: errorStr, isLoading: false });
        },
        messageType
      );
    } catch (error: any) {
      set({
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
        set({
          messages: localMessages,
          currentOffset: localMessages.length,
        });
      }
    } catch (error) {
      console.error('[ChatStore] loadLocalMessages error:', error);
    }
  },
}));

export default useChatStore;
