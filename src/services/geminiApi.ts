import AsyncStorage from '@react-native-async-storage/async-storage';
import { buildDatabaseContext } from './databaseContextBuilder';

// These types define the structure of our chat messages
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

// Configuration constants
const API_KEY = 'AIzaSyDIX8VartqBOrlaqQPH72iRle35bNbRawE';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Gemini API configuration
const GENERATION_CONFIG = {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 2048, // Increased token limit
  stopSequences: ["Human:", "Assistant:"],
};

// Basic system instructions
const BASE_SYSTEM_INSTRUCTIONS = `You are a helpful and knowledgeable AI assistant for the Bloom Budget personal finance app. 
- Provide clear, accurate, and concise responses
- The any Amount will be in INR (₹) only 
- Always use INR (₹) as the currency
- The audience is Indian users
- If you're unsure about something, acknowledge the uncertainty
- Maintain a professional and friendly tone
- Format responses appropriately using markdown when needed
- Never generate harmful or inappropriate content
- Focus on providing financial insights and advice based on the user's data
- if amount does not have any currency symbol, then it is in INR (₹)
`;

/**
 * Builds system instructions with or without financial context based on user preference
 */
async function buildSystemInstructions(useFinancialContext: boolean = true): Promise<string> {
  try {
    // If financial context is disabled, return only base instructions
    if (!useFinancialContext) {
      return `${BASE_SYSTEM_INSTRUCTIONS}

You are a general financial advisor who understands Indian personal finance. 
Since you don't have access to the user's specific financial data, provide general advice and insights.
Ask clarifying questions when needed to provide better guidance.`;
    }
    
    // Get financial context from database
    const financialContext = await buildDatabaseContext();
    
    // Combine base instructions with financial context
    return `${BASE_SYSTEM_INSTRUCTIONS}

IMPORTANT: Use the following financial data from the user's Bloom Budget app to provide personalized advice and insights. This is REAL financial data from the user's accounts, all the amount in INR:

${financialContext}

When answering questions:
1. Reference the user's actual financial data when relevant
2. Provide personalized advice based on their spending patterns and goals
3. Be specific with recommendations based on their budget categories and accounts
4. Help the user understand their financial situation and make better decisions
5. Avoid mentioning that you have access to their data in every response, just use it naturally
6. if amount does not have any currency symbol, then it is in INR (₹)
7. do not inculde transfer transaction in expense or income
`;
  } catch (error) {
    console.error('Error building system instructions:', error);
    return BASE_SYSTEM_INSTRUCTIONS;
  }
}

/**
 * Sends a message to the Gemini API and returns the response
 */
export async function sendMessageToGemini(
  messages: ChatMessage[],
  useFinancialContext: boolean = true
): Promise<string> {
  try {
    // Get enhanced system instructions with or without financial context
    const systemInstructions = await buildSystemInstructions(useFinancialContext);
    
    // Format messages for Gemini API
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));

    // Add system instructions as the first message if it's a new conversation or first in a while
    if (messages.length <= 1 || shouldRefreshContext(messages)) {
      formattedMessages.unshift({
        role: 'assistant',
        parts: [{ text: systemInstructions }]
      });
    }

    const response = await fetch(`${API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: formattedMessages,
        generationConfig: GENERATION_CONFIG,
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error sending message to Gemini:', error);
    throw error;
  }
}

/**
 * Determine if we should refresh the context based on conversation history
 * This helps keep the model up-to-date with latest financial data 
 * without sending context with every single message
 */
function shouldRefreshContext(messages: ChatMessage[]): boolean {
  if (messages.length < 2) return true;
  
  // Check if the last context refresh was more than 10 messages ago
  const messagesSinceRefresh = messages.length % 10;
  if (messagesSinceRefresh === 0) return true;
  
  // Also refresh if the conversation has been inactive for a while
  const lastMessageTime = messages[messages.length - 1].timestamp;
  const currentTime = Date.now();
  const hoursSinceLastMessage = (currentTime - lastMessageTime) / (1000 * 60 * 60);
  
  return hoursSinceLastMessage > 1; // Refresh if more than 1 hour has passed
}

// Storage keys
const CHAT_SESSIONS_KEY = 'gemini_chat_sessions';

/**
 * Save a chat session to AsyncStorage
 */
export async function saveChatSession(session: ChatSession): Promise<void> {
  try {
    // Get existing sessions
    const existingSessions = await getChatSessions();
    
    // Find if session already exists
    const sessionIndex = existingSessions.findIndex(s => s.id === session.id);
    
    if (sessionIndex >= 0) {
      // Update existing session
      existingSessions[sessionIndex] = session;
    } else {
      // Add new session
      existingSessions.push(session);
    }
    
    // Save back to AsyncStorage
    await AsyncStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(existingSessions));
  } catch (error) {
    console.error('Error saving chat session:', error);
    throw error;
  }
}

/**
 * Get all chat sessions from AsyncStorage
 */
export async function getChatSessions(): Promise<ChatSession[]> {
  try {
    const sessions = await AsyncStorage.getItem(CHAT_SESSIONS_KEY);
    return sessions ? JSON.parse(sessions) : [];
  } catch (error) {
    console.error('Error getting chat sessions:', error);
    return [];
  }
}

/**
 * Delete a chat session from AsyncStorage
 */
export async function deleteChatSession(sessionId: string): Promise<void> {
  try {
    const sessions = await getChatSessions();
    const updatedSessions = sessions.filter(session => session.id !== sessionId);
    await AsyncStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(updatedSessions));
  } catch (error) {
    console.error('Error deleting chat session:', error);
    throw error;
  }
}

/**
 * Create a new chat session
 */
export function createNewChatSession(): ChatSession {
  return {
    id: Date.now().toString(),
    title: 'New Chat',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}