import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Modal, 
  SafeAreaView, 
  Dimensions, 
  Platform, 
  StatusBar, 
  KeyboardAvoidingView,
  StyleSheet,
  ActivityIndicator,
  Switch,
  ToastAndroid,
  Alert
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useChat } from '../../contexts/ChatContext';
import { useTheme } from '../../contexts/ThemeContext';
import { chatTheme } from '../../utils/chatTheme';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ChatHistoryList from './ChatHistoryList';
import fontStyles from '@/utils/fontStyles';

export default function ChatScreen() {
  const { 
    currentSession, 
    sessions,
    loading, 
    error, 
    sendMessage, 
    createSession, 
    deleteSession, 
    loadSession,
    updateSessionTitle,
    databaseLoaded,
    useFinancialContext,
    toggleFinancialContext
  } = useChat();
  
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? chatTheme.dark : chatTheme.light;
  
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));
  const isMobile = dimensions.width < 768;

  // Update dimensions when screen size changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => subscription.remove();
  }, []);
  
  // Scroll to bottom whenever messages change
  const scrollToBottom = () => {
    if (flatListRef.current && currentSession?.messages.length) {
      flatListRef.current.scrollToEnd({ animated: false });
    }
  };

  // Add a slight delay to ensure scrolling works after layout
  useEffect(() => {
    if (currentSession?.messages.length) {
      setTimeout(scrollToBottom, 100);
    }
  }, [currentSession?.messages.length]);

  // Handle toggle financial context
  const handleToggleFinancialContext = () => {
    toggleFinancialContext();
    
    // Show feedback to user
    if (Platform.OS === 'android') {
      ToastAndroid.show(
        `Financial context ${!useFinancialContext ? 'enabled' : 'disabled'}`,
        ToastAndroid.SHORT
      );
    } else {
      Alert.alert(
        'Financial Context',
        `Financial context has been ${!useFinancialContext ? 'enabled' : 'disabled'}.`,
        [{ text: 'OK' }]
      );
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
      paddingBottom: 90,
    },
    sidebar: {
      width: 280,
      borderRightWidth: 1,
      borderRightColor: theme.border
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      backgroundColor: theme.surface,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 1,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
      marginLeft: 8,
      flex: 1,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerButton: {
      padding: 8,
      marginLeft: 8,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16
    },
    welcomeTitle: {
      fontSize: 24,
      ...fontStyles('extrabold'),
      textAlign: 'center',
      marginBottom: 8,
      color: theme.text
    },
    welcomeSubtitle: {
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
      fontSize: 16,
      maxWidth: '80%',
    },
    suggestion: {
      backgroundColor: theme.primaryLight,
      borderRadius: 20,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    suggestionText: {
      color: isDarkMode ? theme.text : theme.primaryDark,
      fontSize: 14,
      flex: 1,
      marginLeft: 12,
    },
    suggestionIcon: {
      width: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    listContent: {
      paddingVertical: 16, 
      paddingHorizontal: isMobile ? 8 : 16
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.background
    },
    loadingText: {
      fontSize: 16,
      color: theme.text,
      marginTop: 12
    },
    errorContainer: {
      backgroundColor: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
      padding: 12,
      marginHorizontal: 16,
      marginBottom: 8,
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: theme.error
    },
    errorText: {
      color: theme.error
    },
    databaseBadge: {
      position: 'absolute',
      top: 12,
      right: 12,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: databaseLoaded ? 'rgba(33, 150, 91, 0.2)' : 'rgba(239, 68, 68, 0.2)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      zIndex: 10,
    },
    databaseBadgeText: {
      fontSize: 12,
      color: databaseLoaded ? theme.primary : theme.error,
      marginLeft: 4,
    },
    dbConnectedText: {
      marginTop: 8,
      color: theme.primary,
      fontSize: 14,
    },
    settingsModal: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    settingsContent: {
      backgroundColor: theme.surface,
      borderRadius: 20,
      padding: 20,
      minHeight: 200,
    },
    settingsTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
      marginBottom: 20,
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    settingLabel: {
      fontSize: 16,
      color: theme.text,
      flex: 1,
    },
    settingDescription: {
      fontSize: 14,
      color: theme.textSecondary,
      marginTop: 4,
    },
    contextBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      marginLeft: 8,
    },
    contextBadgeText: {
      fontSize: 12,
      fontWeight: '500',
    },
  });

  // Define suggestion icons and text
  const suggestions = [
    { 
      icon: 'trending-up', 
      text: 'How can I improve my budget this month?',
      component: MaterialIcons
    },
    { 
      icon: 'analytics', 
      text: 'Where am I spending the most money?',
      component: MaterialIcons
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}
      >
        <View style={{ flex: 1, flexDirection: 'row' }}>
          {/* Sidebar for larger screens or Modal for mobile */}
          {isMobile ? (
            <Modal
              visible={showSidebar}
              animationType="slide"
              onRequestClose={() => setShowSidebar(false)}
              statusBarTranslucent
            >
              <SafeAreaView style={{ flex: 1, backgroundColor: theme.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
                <ChatHistoryList
                  sessions={sessions}
                  currentSessionId={currentSession?.id || null}
                  onSelectSession={(id) => {
                    loadSession(id);
                    setShowSidebar(false);
                  }}
                  onDeleteSession={deleteSession}
                  onUpdateSessionTitle={updateSessionTitle}
                  onCreateNewSession={() => {
                    createSession();
                    setShowSidebar(false);
                  }}
                  onClose={() => setShowSidebar(false)}
                  isDarkMode={isDarkMode}
                />
              </SafeAreaView>
            </Modal>
          ) : (
            <View style={styles.sidebar}>
              <ChatHistoryList
                sessions={sessions}
                currentSessionId={currentSession?.id || null}
                onSelectSession={loadSession}
                onDeleteSession={deleteSession}
                onUpdateSessionTitle={updateSessionTitle}
                onCreateNewSession={createSession}
                isDarkMode={isDarkMode}
              />
            </View>
          )}
          
          {/* Main Chat Area */}
          <View style={{ flex: 1 }}>
            {/* Header */}
            <View style={styles.header}>
              {isMobile && (
                <TouchableOpacity 
                  onPress={() => setShowSidebar(true)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="menu" size={24} color={theme.text} />
                </TouchableOpacity>
              )}
              
              <Text 
                style={styles.headerTitle}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {currentSession?.title || 'AI Chat'}
              </Text>

              {/* Context badge - shows if personal data is being used */}
              {currentSession && currentSession.messages.length > 0 && (
                <View 
                  style={[
                    styles.contextBadge, 
                    { 
                      backgroundColor: useFinancialContext 
                        ? 'rgba(33, 150, 91, 0.2)' 
                        : 'rgba(107, 114, 128, 0.2)' 
                    }
                  ]}
                >
                  <Text 
                    style={[
                      styles.contextBadgeText, 
                      { 
                        color: useFinancialContext 
                          ? theme.primary 
                          : theme.textSecondary
                      }
                    ]}
                  >
                    {useFinancialContext ? 'Personal' : 'General'}
                  </Text>
                </View>
              )}
              
              <View style={styles.headerActions}>
                <TouchableOpacity 
                  onPress={() => setShowSettings(true)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.headerButton}
                >
                  <Ionicons name="settings-outline" size={22} color={theme.text} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={createSession}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.headerButton}
                >
                  <Ionicons name="add-circle-outline" size={24} color={theme.primary} />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Messages */}
            {currentSession ? (
              <View style={{ flex: 1 }}>
                {currentSession.messages.length === 0 ? (
                  <View style={styles.emptyContainer}>

                    <Text style={styles.welcomeTitle}>
                      Welcome to Bloom AI
                    </Text>
                    <Text style={styles.welcomeSubtitle}>
                      Your Personal AI Assistant
                    </Text>
                    {databaseLoaded && useFinancialContext && (
                      <Text style={styles.dbConnectedText}>
                        Connected to your financial data
                      </Text>
                    )}
                    <View style={{ width: isMobile ? '90%' : '60%', marginTop: 24 }}>
                      {suggestions.map((suggestion) => (
                        <TouchableOpacity
                          key={suggestion.text}
                          style={styles.suggestion}
                          onPress={() => sendMessage(suggestion.text)}
                          activeOpacity={0.7}
                          disabled={useFinancialContext && !databaseLoaded}
                        >
                          <View style={styles.suggestionIcon}>
                            <suggestion.component 
                              name={suggestion.icon} 
                              size={20} 
                              color={isDarkMode ? theme.text : theme.primaryDark} 
                            />
                          </View>
                          <Text style={styles.suggestionText}>
                            {suggestion.text}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ) : (
                  <FlatList
                    ref={flatListRef}
                    data={currentSession.messages}
                    keyExtractor={(item) => `${item.timestamp}`}
                    renderItem={({ item }) => (
                      <ChatMessage message={item} isDarkMode={isDarkMode} />
                    )}
                    contentContainerStyle={styles.listContent}
                    onContentSizeChange={scrollToBottom}
                    onLayout={scrollToBottom}
                    showsVerticalScrollIndicator={true}
                    initialNumToRender={15}
                    maxToRenderPerBatch={10}
                    windowSize={10}
                    style={{ backgroundColor: theme.background }}
                  />
                )}
                
                {/* Error message if any */}
                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}
                
                {/* Input */}
                <View style={{ paddingTop: 1, paddingBottom: 2 }}>
                  <ChatInput 
                    onSend={sendMessage} 
                    loading={loading} 
                    isDarkMode={isDarkMode}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={styles.loadingText}>Loading your chats...</Text>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={[styles.settingsModal, { justifyContent: 'center', alignItems: 'center' }]}>
          <View style={[styles.settingsContent, { width: '90%', alignSelf: 'center' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={styles.settingsTitle}>AI Chat Settings</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <View style={[styles.settingRow, { alignItems: 'center' }]}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.settingLabel}>Use Personal Financial Data</Text>
                <Text style={styles.settingDescription}>
                  Enable AI to access your budgets, transactions, and goals for personalized recommendations
                </Text>
              </View>
              <Switch
                value={useFinancialContext}
                onValueChange={handleToggleFinancialContext}
                trackColor={{ false: "#767577", true: theme.primaryLight }}
                thumbColor={useFinancialContext ? theme.primary : "#f4f3f4"}
                ios_backgroundColor="#3e3e3e"
                disabled={!databaseLoaded}
                style={{ marginLeft: 8 }}
              />
            </View>
            
            {!databaseLoaded && (
              <Text style={{ color: theme.error, marginTop: 12, fontSize: 14, alignSelf: 'center', textAlign: 'center' }}>
                Database connection required to enable personal data. Please try again later.
              </Text>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
} 