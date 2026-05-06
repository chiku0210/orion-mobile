import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  PermissionsAndroid,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import ChatBubble from '../components/ChatBubble';
import InputBar from '../components/InputBar';
import TypingIndicator from '../components/TypingIndicator';
import { Message } from '../types';
import { useChatStore } from '../store/chatStore';
import { voiceService } from '../services/voiceService';
import { backgroundService } from '../services/backgroundService';
import { messagesApi } from '../services/api';
import { authStorage } from '../services/storage';

interface ChatScreenProps {
  navigation?: any;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ navigation }) => {
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Message[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const {
    messages,
    fetchMessages,
    sendMessage,
    loadLocalMessages,
    loadMoreMessages,
    isFetchingMore,
    hasMore,
    isRecording,
    isProcessingVoice,
  } = useChatStore();

  useEffect(() => {
    loadLocalMessages().then(() => fetchMessages());
    
    // Request permissions and start ORION background listening service
    const startService = async () => {
      // Small delay to ensure UI is ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'ORION needs access to your microphone for wake-word detection.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          await backgroundService.start();
        } else {
          console.warn('[ChatScreen] Microphone permission denied — background service not started');
        }
      } else {
        await backgroundService.start();
      }
    };

    startService().catch(console.error);
  }, [fetchMessages, loadLocalMessages]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (!query.trim()) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeout.current = setTimeout(async () => {
      const token = await authStorage.getToken();
      if (!token) {
        return;
      }

      try {
        const response = await messagesApi.searchMessages(token, query);
        if (response.success && response.data) {
          setSearchResults(response.data.messages);
        }
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms debounce
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isSending) {
      return;
    }
    setIsSending(true);
    try {
      await sendMessage(text.trim());
    } finally {
      setIsSending(false);
    }
  };

  const handleVoicePress = () => {
    if (isRecording) {
      console.log('[ChatScreen] Manual voice recording stop triggered');
      voiceService.handleManualStop();
    } else {
      console.log('[ChatScreen] Manual voice recording start triggered');
      voiceService.startRecording();
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <ChatBubble message={item} />
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => voiceService.playLastRecording()}
          style={styles.debugButton}
        >
          <Text style={styles.settingsText}>Play Last</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ORION</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          style={styles.settingsButton}
        >
          <Text style={styles.settingsText}>Settings</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search history..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#6D6D72"
        />
        {isSearching && <ActivityIndicator size="small" color="#007AFF" />}
      </View>

      <View style={styles.messageList}>
        {searchResults ? (
          <FlashList
            data={searchResults}
            renderItem={renderMessage}
            keyExtractor={item => `search-${item.id}`}
            estimatedItemSize={100}
            contentContainerStyle={styles.messageListContent}
            ListHeaderComponent={() => (
              <Text style={styles.searchLabel}>
                {searchResults.length} results for "{searchQuery}"
              </Text>
            )}
          />
        ) : (
          <FlashList
            inverted
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id.toString()}
            estimatedItemSize={100}
            contentContainerStyle={styles.messageListContent}
            onEndReached={() => {
              if (hasMore) {
                loadMoreMessages();
              }
            }}
            onEndReachedThreshold={0.2}
            ListFooterComponent={
              isFetchingMore ? (
                <ActivityIndicator color="#007AFF" style={styles.loadMoreSpinner} />
              ) : null
            }
            ListHeaderComponent={
              isSending ? <TypingIndicator visible={true} /> : null
            }
          />
        )}
      </View>

      <InputBar
        onSend={handleSendMessage}
        onVoicePress={handleVoicePress}
        disabled={isSending}
        isRecording={isRecording}
        isProcessing={isProcessingVoice}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    height: 60,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  debugButton: { paddingLeft: 8 },
  settingsButton: { paddingRight: 8 },
  settingsText: { color: '#FFFFFF', fontSize: 14, opacity: 0.85 },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#000000',
  },
  searchLabel: {
    fontSize: 12,
    color: '#8E8E93',
    paddingHorizontal: 16,
    paddingVertical: 8,
    textAlign: 'center',
  },
  messageList: { flex: 1 },
  messageListContent: { paddingVertical: 12 },
  loadMoreSpinner: { paddingVertical: 12 },
});

export default ChatScreen;
