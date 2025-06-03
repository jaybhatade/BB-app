import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  ChatSession, 
  ChatMessage, 
  createNewChatSession, 
  getChatSessions, 
  saveChatSession, 
  deleteChatSession,
  sendMessageToGemini
} from '../services/geminiApi';
import { useDatabase } from './DatabaseContext';

interface ChatContextType {
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  loading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  createSession: () => void;
  deleteSession: (sessionId: string) => Promise<void>;
  loadSession: (sessionId: string) => void;
  updateSessionTitle: (sessionId: string, title: string) => Promise<void>;
  databaseLoaded: boolean;
  useFinancialContext: boolean;
  toggleFinancialContext: () => void;
}

const FINANCIAL_CONTEXT_KEY = 'use_financial_context';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isInitialized } = useDatabase();
  
  // Track database initialization status
  const [databaseLoaded, setDatabaseLoaded] = useState(false);
  
  // Financial context toggle state
  const [useFinancialContext, setUseFinancialContext] = useState(true);
  
  // Monitor database initialization status
  useEffect(() => {
    if (isInitialized) {
      setDatabaseLoaded(true);
    }
  }, [isInitialized]);

  // Load financial context preference
  useEffect(() => {
    const loadFinancialContextPreference = async () => {
      try {
        const savedPreference = await AsyncStorage.getItem(FINANCIAL_CONTEXT_KEY);
        if (savedPreference !== null) {
          setUseFinancialContext(savedPreference === 'true');
        }
      } catch (error) {
        console.error('Error loading financial context preference:', error);
      }
    };
    
    loadFinancialContextPreference();
  }, []);

  // Toggle financial context and save preference
  const toggleFinancialContext = async () => {
    const newValue = !useFinancialContext;
    setUseFinancialContext(newValue);
    try {
      await AsyncStorage.setItem(FINANCIAL_CONTEXT_KEY, newValue.toString());
    } catch (error) {
      console.error('Error saving financial context preference:', error);
    }
  };

  // Load all sessions on mount
  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true);
        const loadedSessions = await getChatSessions();
        setSessions(loadedSessions);
        
        // If there are sessions, load the most recent one
        if (loadedSessions.length > 0) {
          // Sort by updatedAt (most recent first)
          const sortedSessions = [...loadedSessions].sort((a, b) => b.updatedAt - a.updatedAt);
          setCurrentSession(sortedSessions[0]);
        } else {
          // Create a new session if none exist
          const newSession = createNewChatSession();
          setSessions([newSession]);
          setCurrentSession(newSession);
          await saveChatSession(newSession);
        }
      } catch (err) {
        setError('Failed to load chat sessions');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, []);

  // Create a new chat session
  const createSession = () => {
    const newSession = createNewChatSession();
    setCurrentSession(newSession);
    setSessions(prev => [newSession, ...prev]);
    
    // Save the new session
    saveChatSession(newSession).catch(err => {
      console.error('Failed to save new session:', err);
      setError('Failed to create new chat');
    });
  };

  // Load a specific chat session
  const loadSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSession(session);
    }
  };

  // Delete a chat session
  const deleteSession = async (sessionId: string) => {
    try {
      await deleteChatSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      // If the current session was deleted, load another one or create a new one
      if (currentSession?.id === sessionId) {
        const remainingSessions = sessions.filter(s => s.id !== sessionId);
        if (remainingSessions.length > 0) {
          setCurrentSession(remainingSessions[0]);
        } else {
          createSession();
        }
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
      setError('Failed to delete chat');
    }
  };

  // Update a session title
  const updateSessionTitle = async (sessionId: string, title: string) => {
    try {
      const sessionToUpdate = sessions.find(s => s.id === sessionId);
      if (!sessionToUpdate) return;

      const updatedSession = {
        ...sessionToUpdate,
        title,
        updatedAt: Date.now(),
      };

      // Update in state
      setSessions(prev => 
        prev.map(s => s.id === sessionId ? updatedSession : s)
      );
      
      // Update current session if it's the one being edited
      if (currentSession?.id === sessionId) {
        setCurrentSession(updatedSession);
      }

      // Save to storage
      await saveChatSession(updatedSession);
    } catch (err) {
      console.error('Failed to update session title:', err);
      setError('Failed to update chat title');
    }
  };

  // Send a message in the current session
  const sendMessage = async (content: string) => {
    if (!currentSession) return;
    
    try {
      // Check if database is initialized before proceeding with financial context
      if (useFinancialContext && !isInitialized) {
        setError('Database is not yet initialized. Please try again in a moment or disable financial context.');
        return;
      }
      
      setLoading(true);
      setError(null);

      // Create user message
      const userMessage: ChatMessage = {
        role: 'user',
        content,
        timestamp: Date.now(),
      };

      // Update session with user message
      const updatedMessages = [...currentSession.messages, userMessage];
      const updatedSession = {
        ...currentSession,
        messages: updatedMessages,
        updatedAt: Date.now(),
      };

      // Update state immediately to show user message
      setCurrentSession(updatedSession);
      setSessions(prev => 
        prev.map(s => s.id === currentSession.id ? updatedSession : s)
      );

      // Get response from Gemini API with database context
      const aiResponse = await sendMessageToGemini(updatedMessages, useFinancialContext);

      // Create AI message
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: aiResponse,
        timestamp: Date.now(),
      };

      // Update with AI response
      const finalMessages = [...updatedMessages, aiMessage];
      const finalSession = {
        ...updatedSession,
        messages: finalMessages,
        // Update title if it's the first message
        title: updatedSession.messages.length <= 1 ? content.slice(0, 30) : updatedSession.title,
        updatedAt: Date.now(),
      };

      // Update state with AI response
      setCurrentSession(finalSession);
      setSessions(prev => 
        prev.map(s => s.id === currentSession.id ? finalSession : s)
      );

      // Save to storage
      await saveChatSession(finalSession);
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to get AI response');
    } finally {
      setLoading(false);
    }
  };

  const value = {
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
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

// Custom hook to use the chat context
export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
} 