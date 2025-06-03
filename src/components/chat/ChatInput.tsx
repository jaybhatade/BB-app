import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator, Platform, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chatTheme } from '../../utils/chatTheme';

interface ChatInputProps {
  onSend: (message: string) => void;
  loading: boolean;
  isDarkMode: boolean;
}

export default function ChatInput({ onSend, loading, isDarkMode }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const theme = isDarkMode ? chatTheme.dark : chatTheme.light;
  
  const handleSend = () => {
    if (message.trim() && !loading) {
      onSend(message.trim());
      setMessage('');
    }
  };
  
  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: isFocused ? theme.primary : theme.border,
      borderRadius: 24,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginHorizontal: 16,
      marginBottom: Platform.OS === 'ios' ? 24 : 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    input: {
      flex: 1,
      backgroundColor: theme.inputBackground,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginRight: 8,
      maxHeight: 120,
      minHeight: 44,
      fontSize: 16,
      color: theme.text,
      fontFamily: 'Figtree-Regular',
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: message.trim() && !loading ? theme.primary : theme.buttonDisabled,
      alignItems: 'center',
      justifyContent: 'center',
      transform: [{ scale: message.trim() && !loading ? 1 : 0.9 }],
    },
    sendIcon: {
      transform: [{ scale: 0.9 }],
    }
  });
  
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Type your message..."
        placeholderTextColor={theme.textSecondary}
        value={message}
        onChangeText={setMessage}
        multiline
        maxLength={2000}
        returnKeyType="default"
        onSubmitEditing={handleSend}
        editable={!loading}
        autoCapitalize="sentences"
        blurOnSubmit={Platform.OS === 'ios'}
        selectionColor={theme.primary}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      <TouchableOpacity 
        onPress={handleSend}
        disabled={!message.trim() || loading}
        style={styles.sendButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Ionicons 
            name="send" 
            size={20} 
            color="#ffffff" 
            style={styles.sendIcon}
          />
        )}
      </TouchableOpacity>
    </View>
  );
} 