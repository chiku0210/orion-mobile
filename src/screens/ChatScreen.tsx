import React, { useState, useEffect, useRef } from 'react';
import { View, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text } from 'react-native';
import ChatBubble from '../components/ChatBubble';
import InputBar from '../components/InputBar';
import TypingIndicator from '../components/TypingIndicator';
import { Message } from '../types';

interface ChatScreenProps {
  navigation?: any;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ navigation }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputDisabled, setInputDisabled] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Initial welcome message
    const welcomeMessage: Message = {
      id: 1,
      role: 'assistant',
      content: 'Hello! How can I help you today?',
      messageType: 'text',
      createdAt: new Date().toISOString(),
    };
    setMessages([welcomeMessage]);
  }, []);

  const handleSendMessage = async (text: string) => {
    const userMessage: Message = {
      id: messages.length + 1,
      role: 'user',
      content: text,
      messageType: 'text',
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputDisabled(true);
    setIsTyping(true);

    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: messages.length + 2,
        role: 'assistant',
        content: `You said: "${text}". This is a mock response for demonstration.`,
        messageType: 'text',
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
      setInputDisabled(false);
    }, 1500);
  };

  const handleVoicePress = () => {
    // Voice input handling would go here
    console.log('Voice button pressed');
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <ChatBubble message={item} />
  );

  const renderTypingIndicator = () => (
    isTyping ? <TypingIndicator visible={isTyping} /> : null
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat</Text>
      </View>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id.toString()}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListFooterComponent={renderTypingIndicator}
      />
      <InputBar
        onSend={handleSendMessage}
        onVoicePress={handleVoicePress}
        disabled={inputDisabled}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 60,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingVertical: 12,
  },
});

export default ChatScreen;
