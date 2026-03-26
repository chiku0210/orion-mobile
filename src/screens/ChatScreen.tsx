import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import ChatBubble from '../components/ChatBubble';
import InputBar from '../components/InputBar';
import TypingIndicator from '../components/TypingIndicator';
import { Message } from '../types';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';

interface ChatScreenProps {
  navigation?: any;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ navigation }) => {
  const [isSending, setIsSending] = useState(false);

  const { messages, fetchMessages, sendMessage, loadLocalMessages } =
    useChatStore();
  const { logout } = useAuthStore();

  useEffect(() => {
    loadLocalMessages().then(() => fetchMessages());
  }, []);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isSending) return;
    setIsSending(true);
    try {
      await sendMessage(text.trim());
    } finally {
      setIsSending(false);
    }
  };

  const handleVoicePress = () => {
    console.log('Voice button pressed');
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
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
        <Text style={styles.headerTitle}>ORION</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        inverted
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id.toString()}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        ListHeaderComponent={
          isSending ? <TypingIndicator visible={true} /> : null
        }
      />

      <InputBar
        onSend={handleSendMessage}
        onVoicePress={handleVoicePress}
        disabled={isSending}
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
  logoutButton: { position: 'absolute', right: 16 },
  logoutText: { color: '#FFFFFF', fontSize: 14, opacity: 0.85 },
  messageList: { flex: 1 },
  messageListContent: { paddingVertical: 12 },
});

export default ChatScreen;
