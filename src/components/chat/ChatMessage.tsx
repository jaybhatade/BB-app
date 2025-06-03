import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Dimensions, StyleSheet, TouchableOpacity, Platform, Animated } from 'react-native';
import { ChatMessage as ChatMessageType } from '../../services/geminiApi';
import { chatTheme } from '../../utils/chatTheme';
import { Ionicons } from '@expo/vector-icons';

interface ChatMessageProps {
  message: ChatMessageType;
  isDarkMode: boolean;
}

export default function ChatMessage({ message, isDarkMode }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const windowWidth = Dimensions.get('window').width;
  const isMobile = windowWidth < 768;
  const theme = isDarkMode ? chatTheme.dark : chatTheme.light;
  const [isExpanded, setIsExpanded] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const contentHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleReadMore = () => {
    setIsExpanded(!isExpanded);
    Animated.spring(contentHeight, {
      toValue: isExpanded ? 0 : 1,
      tension: 50,
      friction: 7,
      useNativeDriver: false,
    }).start();
  };

  // Format text with basic markdown styling
  const formatMessageText = (text: string) => {
    // First apply markdown formatting
    let formattedText = text
      .replace(/^\s*[-*]\s/gm, '• ') // Convert - or * to bullet points
      .replace(/^\s*\d+\.\s/gm, (match) => match.trim() + ' ') // Format numbered lists
      .replace(/\|\s*\|/g, '|   |'); // Format tables

    // Then handle text truncation
    const isLongMessage = formattedText.length > 300;
    if (!isExpanded && isLongMessage) {
      // Find the last complete sentence or word before the 300 character limit
      const truncatedText = formattedText.substring(0, 300);
      const lastPeriod = truncatedText.lastIndexOf('.');
      const lastSpace = truncatedText.lastIndexOf(' ');
      
      const cutoffPoint = Math.max(lastPeriod, lastSpace);
      return cutoffPoint > 0 ? formattedText.substring(0, cutoffPoint + 1) + '...' : truncatedText + '...';
    }

    return formattedText;
  };

  const renderFormattedText = (text: string) => {
    // Split text into parts based on markdown formatting
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <Text key={index} style={[styles.messageText, styles.boldText]}>
            {part.slice(2, -2)}
          </Text>
        );
      }
      return (
        <Text key={index} style={styles.messageText}>
          {part}
        </Text>
      );
    });
  };
  
  const styles = StyleSheet.create({
    container: {
      padding: 16,
      marginVertical: 8,
      marginHorizontal: 12,
      borderRadius: 20,
      maxWidth: isMobile ? '85%' : '70%',
      alignSelf: isUser ? 'flex-end' : 'flex-start',
      backgroundColor: isUser ? theme.userBubble : theme.aiBubble,
      borderTopRightRadius: isUser ? 4 : 20,
      borderTopLeftRadius: isUser ? 20 : 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDarkMode ? 0.2 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    messageText: {
      fontSize: 16,
      lineHeight: 24,
      color: isUser ? theme.userBubbleText : theme.aiBubbleText,
      fontFamily: 'Figtree-Regular',
    },
    boldText: {
      fontFamily: 'Figtree-SemiBold',
    },
    timestamp: {
      fontSize: 12,
      marginTop: 8,
      color: isUser ? 'rgba(255, 255, 255, 0.7)' : theme.textSecondary,
      alignSelf: 'flex-end',
      fontFamily: 'Figtree-Regular',
    },
    roleIndicator: {
      position: 'absolute',
      top: -4,
      left: isUser ? undefined : -8,
      right: isUser ? -8 : undefined,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: isUser ? theme.userBubble : theme.aiBubble,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    readMoreButton: {
      marginTop: 8,
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 12,
      backgroundColor: isUser ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    },
    readMoreText: {
      color: isUser ? 'rgba(255, 255, 255, 0.9)' : theme.primary,
      fontSize: 14,
      marginLeft: 4,
      fontFamily: 'Figtree-Medium',
    },
    codeBlock: {
      backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)',
      padding: 12,
      borderRadius: 8,
      marginVertical: 8,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    tableContainer: {
      marginVertical: 8,
      borderWidth: 1,
      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
      borderRadius: 8,
      overflow: 'hidden',
    },
    contentContainer: {
      overflow: 'hidden',
    }
  });

  const hasReadMore = message.content.length > 300;
  
  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
      <View style={styles.container}>
        <View style={styles.roleIndicator}>
          <Ionicons 
            name={isUser ? "person" : "sparkles-outline"} 
            size={16} 
            color={isUser ? "#ffffff" : theme.primary} 
          />
        </View>
        
        <Animated.View style={styles.contentContainer}>
          {renderFormattedText(formatMessageText(message.content))}
        </Animated.View>
        
        {hasReadMore && (
          <TouchableOpacity 
            onPress={handleReadMore}
            style={styles.readMoreButton}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={14} 
              color={isUser ? 'rgba(255, 255, 255, 0.9)' : theme.primary} 
            />
            <Text style={styles.readMoreText}>
              {isExpanded ? "Show less" : "Read more"}
            </Text>
          </TouchableOpacity>
        )}
        
        <Text style={styles.timestamp}>
          {new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>
    </Animated.View>
  );
}