import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons, Octicons } from '@expo/vector-icons';
import { ChatSession } from '../../services/geminiApi';
import { chatTheme } from '../../utils/chatTheme';

interface ChatHistoryItemProps {
  session: ChatSession;
  isActive: boolean;
  onPress: () => void;
  onDelete: () => void;
  onEdit: () => void;
  isDarkMode: boolean;
}

export default function ChatHistoryItem({
  session,
  isActive,
  onPress,
  onDelete,
  onEdit,
  isDarkMode
}: ChatHistoryItemProps) {
  const theme = isDarkMode ? chatTheme.dark : chatTheme.light;
  
  // Format date as "Today", "Yesterday", or MM/DD/YYYY
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginHorizontal: 8,
      marginVertical: 4,
      borderRadius: 12,
      backgroundColor: isActive ? theme.highlight : theme.surface,
      borderWidth: 1,
      borderColor: isActive ? theme.primaryLight : theme.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDarkMode ? 0.2 : 0.1,
      shadowRadius: 2,
      elevation: isActive ? 3 : 1
    },
    iconContainer: {
      marginRight: 12,
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: isActive ? theme.primaryLight : theme.inputBackground,
      alignItems: 'center',
      justifyContent: 'center'
    },
    contentContainer: {
      flex: 1
    },
    title: {
      fontWeight: '600',
      fontSize: 16,
      color: isActive ? theme.primary : theme.text
    },
    subtitle: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 4
    },
    actionsContainer: {
      flexDirection: 'row'
    },
    actionButton: {
      padding: 8,
      marginLeft: 4,
      borderRadius: 20
    }
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.container}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons 
          name="chatbubble" 
          size={18} 
          color={isActive ? theme.primary : theme.textSecondary} 
        />
      </View>
      
      <View style={styles.contentContainer}>
        <Text 
          style={styles.title} 
          numberOfLines={1}
        >
          {session.title}
        </Text>
        <Text style={styles.subtitle}>
          {formatDate(session.updatedAt)} • {session.messages.length} messages
        </Text>
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          onPress={onEdit} 
          style={styles.actionButton}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Octicons name="pencil" size={18} color={theme.textSecondary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={onDelete} 
          style={styles.actionButton}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Ionicons name="trash-outline" size={18} color={theme.error} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
} 