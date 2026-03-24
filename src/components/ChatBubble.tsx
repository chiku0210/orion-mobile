import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Message } from '../types';

interface ChatBubbleProps {
  message: Message;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  // Handle both frontend (camelCase) and backend (snake_case) field names
  const messageType = message.messageType || message.message_type || 'text';
  const timestamp = message.createdAt || message.created_at;
  const timeDisplay = timestamp ? new Date(timestamp).toLocaleTimeString() : '';

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.assistantContainer,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        <Text
          style={[
            styles.content,
            isUser ? styles.userContent : styles.assistantContent,
          ]}
        >
          {message.content}
        </Text>
        <View style={styles.metaContainer}>
          <Text
            style={[
              styles.messageType,
              isUser ? styles.userMeta : styles.assistantMeta,
            ]}
          >
            {messageType.toUpperCase()}
          </Text>
          <Text
            style={[
              styles.timestamp,
              isUser ? styles.userMeta : styles.assistantMeta,
            ]}
          >
            {timeDisplay}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    marginHorizontal: 12,
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#E9E9EB',
    borderBottomLeftRadius: 4,
  },
  content: {
    fontSize: 16,
    lineHeight: 20,
  },
  userContent: {
    color: '#FFFFFF',
  },
  assistantContent: {
    color: '#000000',
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 8,
  },
  messageType: {
    fontSize: 10,
    textTransform: 'uppercase',
  },
  timestamp: {
    fontSize: 10,
  },
  userMeta: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  assistantMeta: {
    color: '#666666',
  },
});

export default ChatBubble;
