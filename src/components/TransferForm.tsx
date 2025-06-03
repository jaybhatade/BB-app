import React, { useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, KeyboardAvoidingView, Platform, ScrollView, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import DatePicker from './DatePicker';
import TransferAccountSelectionModal from '@/modals/transferAccountSelectionModal';
import fontStyles from '../utils/fontStyles';

interface Account {
  id: string;
  name: string;
  balance: number;
  icon: string;
}

interface TransferFormProps {
  amount: string;
  setAmount: (amount: string) => void;
  note: string;
  setNote: (note: string) => void;
  date: Date;
  setDate: (date: Date) => void;
  fromAccountId: string | null; // Changed to allow null
  setFromAccountId: (id: string | null) => void; // Changed to allow null
  toAccountId: string | null; // Changed to allow null
  setToAccountId: (id: string | null) => void; // Changed to allow null
  accounts: Account[];
  showFromAccountModal: boolean;
  setShowFromAccountModal: (show: boolean) => void;
  showToAccountModal: boolean;
  setShowToAccountModal: (show: boolean) => void;
}

const TransferForm: React.FC<TransferFormProps> = ({
  amount,
  setAmount,
  note,
  setNote,
  date,
  setDate,
  fromAccountId,
  setFromAccountId,
  toAccountId,
  setToAccountId,
  accounts,
  showFromAccountModal,
  setShowFromAccountModal,
  showToAccountModal,
  setShowToAccountModal,
}) => {
  const { isDarkMode } = useTheme();
  const noteInputRef = useRef<TextInput>(null);

  // Find the current accounts
  const fromAccount = accounts.find(acc => acc.id === fromAccountId);
  const toAccount = accounts.find(acc => acc.id === toAccountId);

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={100}
      >
        <ScrollView 
          className="mt-3"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="mb-5">
            <Text style={fontStyles('bold')} className={`mb-2 text-lg ${isDarkMode ? 'text-white' : 'text-black'}`}>Amount</Text>
            <TextInput
              className={`rounded-[20px] p-5 text-base ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="Enter amount"
              placeholderTextColor={isDarkMode ? '#B0B0B0' : '#707070'}
              returnKeyType="next"
            />
          </View>

          {/* From Account Selector */}
          <View className="mb-5">
            <Text style={fontStyles('bold')} className={`mb-2 text-lg ${isDarkMode ? 'text-white' : 'text-black'}`}>From Account</Text>
            <TouchableOpacity
              className={`rounded-[20px] p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
              onPress={() => setShowFromAccountModal(true)}
            >
              {fromAccount ? (
                <View className="flex-row items-center">
                  <Text style={fontStyles('bold')} className="text-2xl mr-3">{fromAccount.icon}</Text>
                  <View className="flex-1">
                    <Text style={fontStyles('bold')} className={`${isDarkMode ? 'text-white' : 'text-black'}`}>
                      {fromAccount.name}
                    </Text>
                    <Text style={fontStyles('bold')} className={`text-gray-500`}>Balance: ₹{fromAccount.balance}</Text>
                  </View>
                </View>
              ) : (
                <Text style={fontStyles('bold')} className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Select source account
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* To Account Selector */}
          <View className="mb-5">
            <Text style={fontStyles('bold')} className={`mb-2 text-lg ${isDarkMode ? 'text-white' : 'text-black'}`}>To Account</Text>
            <TouchableOpacity
              className={`rounded-[20px] p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
              onPress={() => setShowToAccountModal(true)}
            >
              {toAccount ? (
                <View className="flex-row items-center">
                  <Text style={fontStyles('bold')} className="text-2xl mr-3">{toAccount.icon}</Text>
                  <View className="flex-1">
                    <Text style={fontStyles('bold')} className={`${isDarkMode ? 'text-white' : 'text-black'}`}>
                      {toAccount.name}
                    </Text>
                    <Text style={fontStyles('bold')} className={`text-gray-500`}>Balance: ₹{toAccount.balance}</Text>
                  </View>
                </View>
              ) : (
                <Text style={fontStyles('bold')} className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Select destination account
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <DatePicker
            date={date}
            onChange={setDate}
            label="Date"
          />

          <View className="mb-5">
            <Text style={fontStyles('bold')} className={`mb-2 text-lg ${isDarkMode ? 'text-white' : 'text-black'}`}>Note</Text>
            <TextInput
              ref={noteInputRef}
              className={`rounded-[20px] p-5 text-base h-24 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}
              value={note}
              onChangeText={setNote}
              placeholder="Add a note"
              placeholderTextColor={isDarkMode ? '#B0B0B0' : '#707070'}
              multiline
              textAlignVertical="top"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

export default TransferForm;