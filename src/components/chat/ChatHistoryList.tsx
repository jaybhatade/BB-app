import React, { useState } from 'react';
import { View, FlatList, Text, TouchableOpacity, Modal, TextInput, Alert, StatusBar, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChatSession } from '../../services/geminiApi';
import { chatTheme } from '../../utils/chatTheme';
import ChatHistoryItem from './ChatHistoryItem';

interface ChatHistoryListProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => Promise<void>;
  onUpdateSessionTitle: (sessionId: string, title: string) => Promise<void>;
  onCreateNewSession: () => void;
  onClose?: () => void; // For mobile view to close the sidebar
  isDarkMode: boolean;
}

export default function ChatHistoryList({
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onUpdateSessionTitle,
  onCreateNewSession,
  onClose,
  isDarkMode
}: ChatHistoryListProps) {
  const [editingSession, setEditingSession] = useState<ChatSession | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const theme = isDarkMode ? chatTheme.dark : chatTheme.light;
  
  const handleEdit = (session: ChatSession) => {
    setEditingSession(session);
    setEditTitle(session.title);
  };
  
  const handleSaveTitle = async () => {
    if (editingSession && editTitle.trim()) {
      await onUpdateSessionTitle(editingSession.id, editTitle.trim());
      setEditingSession(null);
    }
  };
  
  const handleDelete = (sessionId: string) => {
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete this chat? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => onDeleteSession(sessionId)
        }
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      backgroundColor: theme.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 1,
      elevation: 2
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text
    },
    newChatButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 16,
      marginVertical: 12,
      paddingVertical: 12,
      backgroundColor: theme.primaryLight,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2
    },
    newChatText: {
      marginLeft: 10,
      color: theme.primary,
      fontWeight: '600',
      fontSize: 16
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20
    },
    emptyText: {
      color: theme.textSecondary,
      textAlign: 'center',
      marginTop: 16,
      fontSize: 16
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
    },
    modalContent: {
      backgroundColor: theme.surface,
      borderRadius: 20,
      padding: 24,
      width: '85%',
      maxWidth: 420,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 10
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '600',
      marginBottom: 16,
      color: theme.text
    },
    modalInput: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      fontSize: 16,
      color: theme.text,
      backgroundColor: theme.inputBackground
    },
    modalButtonsContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end'
    },
    cancelButton: {
      padding: 12,
      marginRight: 16,
      borderRadius: 8
    },
    cancelText: {
      color: theme.textSecondary,
      fontWeight: '500',
      fontSize: 16
    },
    saveButton: {
      backgroundColor: theme.primary,
      borderRadius: 12,
      paddingHorizontal: 24,
      paddingVertical: 12,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4
    },
    saveText: {
      color: '#FFFFFF',
      fontWeight: '600',
      fontSize: 16
    },
    listContent: {
      paddingVertical: 8,
      paddingHorizontal: 8
    }
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat History</Text>
        {onClose && (
          <TouchableOpacity 
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
        )}
      </View>
      
      <TouchableOpacity 
        onPress={onCreateNewSession}
        style={styles.newChatButton}
        activeOpacity={0.7}
      >
        <Ionicons name="add-circle" size={22} color={theme.primary} />
        <Text style={styles.newChatText}>New Chat</Text>
      </TouchableOpacity>
      
      {sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubble-ellipses-outline" size={54} color={theme.textSecondary} />
          <Text style={styles.emptyText}>
            No chat history yet. Start a new conversation!
          </Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatHistoryItem
              session={item}
              isActive={item.id === currentSessionId}
              onPress={() => onSelectSession(item.id)}
              onDelete={() => handleDelete(item.id)}
              onEdit={() => handleEdit(item)}
              isDarkMode={isDarkMode}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
        />
      )}
      
      {/* Edit Title Modal */}
      <Modal
        visible={!!editingSession}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingSession(null)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Chat Title</Text>
            <TextInput
              style={styles.modalInput}
              value={editTitle}
              onChangeText={setEditTitle}
              autoFocus
              maxLength={50}
              selectionColor={theme.primary}
              placeholderTextColor={theme.textSecondary}
            />
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity 
                onPress={() => setEditingSession(null)} 
                style={styles.cancelButton}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleSaveTitle} 
                style={styles.saveButton}
              >
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
} 