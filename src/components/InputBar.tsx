import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Keyboard, Text, ActivityIndicator } from 'react-native';

interface InputBarProps {
  onSend: (message: string) => void;
  onVoicePress?: () => void;
  disabled?: boolean;
  isRecording?: boolean;
  isProcessing?: boolean;
}

const InputBar: React.FC<InputBarProps> = ({ 
  onSend, 
  onVoicePress, 
  disabled = false,
  isRecording = false,
  isProcessing = false
}) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText('');
      Keyboard.dismiss();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          placeholderTextColor="#999999"
          multiline
          maxLength={1000}
          editable={!disabled}
        />
      </View>
      <View style={styles.buttonContainer}>
        {onVoicePress && (
          <TouchableOpacity
            style={[
              styles.iconButton, 
              (disabled || isProcessing) && styles.disabledButton,
              isRecording && styles.recordingButton
            ]}
            onPress={onVoicePress}
            disabled={disabled || isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={[
                styles.iconText, 
                disabled && styles.disabledIconText,
                isRecording && styles.recordingIconText
              ]}>
                {isRecording ? '🔴' : '🎤'}
              </Text>
            )}
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.sendButton, (!text.trim() || disabled) && styles.disabledSendButton]}
          onPress={handleSend}
          disabled={!text.trim() || disabled}
        >
          <Text style={[styles.sendIcon, (!text.trim() || disabled) && styles.disabledSendIcon]}>➤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  inputContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
  },
  input: {
    fontSize: 16,
    color: '#000000',
    maxHeight: 84,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    padding: 8,
  },
  iconText: {
    fontSize: 20,
  },
  disabledIconText: {
    opacity: 0.5,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledSendButton: {
    backgroundColor: '#E0E0E0',
  },
  disabledSendIcon: {
    color: '#999999',
  },
  recordingButton: {
    backgroundColor: '#FF3B3015',
    borderRadius: 20,
  },
  recordingIconText: {
    color: '#FF3B30',
  },
});

export default InputBar;
