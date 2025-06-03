import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { CheckCircle, X } from 'lucide-react-native';
import fontStyles from '../utils/fontStyles';

interface Account {
  id: string;
  name: string;
  balance: number;
  icon: string;
}

interface TransferAccountSelectionModalProps {
  accounts: Account[];
  accountId: string | null; // Changed to allow null for no selection
  setAccountId: (id: string | null) => void; // Changed to allow null for deselection
  setShowModal: (show: boolean) => void;
  title: string;
  isFromAccount?: boolean;
  fromAccountId?: string | null; // Changed to allow null
  toAccountId?: string | null; // Changed to allow null
}

const TransferAccountSelectionModal: React.FC<TransferAccountSelectionModalProps> = ({
  accounts,
  accountId,
  setAccountId,
  setShowModal,
  title,
  isFromAccount,
  fromAccountId,
  toAccountId
}) => {
  const { isDarkMode } = useTheme();
  
  const handleAccountSelect = (selectedAccountId: string) => {
    // If the account is already selected, deselect it
    if (accountId === selectedAccountId) {
      setAccountId(null);
      setShowModal(false);
      return;
    }
    
    // Check if user is trying to select the same account for both source and destination
    if (isFromAccount !== undefined) {
      if (isFromAccount && selectedAccountId === toAccountId) {
        Alert.alert(
          "Invalid Selection",
          "You cannot select the same account as both source and destination.",
          [{ text: "OK" }]
        );
        return;
      } else if (!isFromAccount && selectedAccountId === fromAccountId) {
        Alert.alert(
          "Invalid Selection",
          "You cannot select the same account as both source and destination.",
          [{ text: "OK" }]
        );
        return;
      }
    }
    
    setAccountId(selectedAccountId);
    setShowModal(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-black/80 justify-end"
    >
      <View className={`rounded-t-2xl p-5 max-h-[80%] min-h-[50%] ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <View className="flex-row justify-between items-center mb-5">
          <Text className={`${fontStyles.heading} ${isDarkMode ? 'text-white' : 'text-black'}`}>{title}</Text>
          <TouchableOpacity onPress={() => setShowModal(false)}>
            <X size={24} color={isDarkMode ? '#FFFFFF' : '#000000'} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={accounts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              className={`flex-row items-center p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
              onPress={() => handleAccountSelect(item.id)}
            >
              <View className="w-10 h-10 rounded-full bg-blue-500 justify-center items-center mr-4">
                <Text className="text-xl text-white">{item.icon}</Text>
              </View>
              <View>
                <Text className={`${fontStyles.body} ${isDarkMode ? 'text-white' : 'text-black'}`}>{item.name}</Text>
                <Text className={`${fontStyles.caption} text-gray-500`}>Balance: ₹{item.balance}</Text>
              </View>
              {accountId === item.id && (
                <View className="ml-auto">
                  <CheckCircle size={24} color="#21965B" />
                </View>
              )}
            </TouchableOpacity>
          )}
        />
        
        {/* Add a deselect button if an account is currently selected */}
        {accountId && (
          <TouchableOpacity 
            className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
            onPress={() => {
              setAccountId(null);
              setShowModal(false);
            }}
          >
            <Text className={`${fontStyles.buttonText} text-center ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Clear Selection
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default TransferAccountSelectionModal;