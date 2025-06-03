import React from 'react';
import { SafeAreaView } from 'react-native';
import { ChatProvider } from '../contexts/ChatContext';
import ChatScreen from '../components/chat/ChatScreen';

export default function AIScreen() {
  return (
    <SafeAreaView className="flex-1">
      <ChatProvider>
        <ChatScreen />
      </ChatProvider>
    </SafeAreaView>
  );
} 