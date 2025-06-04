import React, { useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import DatePicker from './DatePicker';
import fontStyles from '@/utils/fontStyles';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface Account {
  id: string;
  name: string;
  balance: number;
  icon: string;
}

interface TransactionFormProps {
  title: string;
  setTitle: (title: string) => void;
  amount: string;
  setAmount: (amount: string) => void;
  note: string;
  setNote: (note: string) => void;
  date: Date;
  setDate: (date: Date) => void;
  categoryId: string;
  setCategoryId: (id: string) => void;
  accountId: string;
  setAccountId: (id: string) => void;
  categories: Category[];
  accounts: Account[];
  showCategoryModal: boolean;
  setShowCategoryModal: (show: boolean) => void;
  showAccountModal: boolean;
  setShowAccountModal: (show: boolean) => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({
  title,
  setTitle,
  amount,
  setAmount,
  note,
  setNote,
  date,
  setDate,
  categoryId,
  setCategoryId,
  accountId,
  setAccountId,
  categories,
  accounts,
  showCategoryModal,
  setShowCategoryModal,
  showAccountModal,
  setShowAccountModal,
}) => {
  const { isDarkMode } = useTheme();
  const noteInputRef = useRef<TextInput>(null);

  const handleCategorySelect = (category: Category) => {
    setCategoryId(category.id);
    setShowCategoryModal(false);
  };

  const handleAccountSelect = (account: Account) => {
    setAccountId(account.id);
    setShowAccountModal(false);
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Tailwind-style classes for light/dark mode
  const labelClass = `text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`;
  const inputClass = `rounded-[20px] py-5 px-4 text-base ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-white text-black'}`;
  const placeholderClass = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const selectorClass = `rounded-[20px] p-4 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`;

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={100}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          <View className="w-full">

            <View className="mb-5">
              <Text style={fontStyles('bold')} className={labelClass}>Amount</Text>
              <TextInput
                className={inputClass}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="Enter amount"
                placeholderTextColor={isDarkMode ? '#B0B0B0' : '#707070'}
                returnKeyType="next"
              />
            </View>
            {/* Title Field */}
            <View className="mb-5">
              <Text style={fontStyles('bold')} className={`${labelClass} mt-2`}>Description</Text>
              <TextInput
                className={inputClass}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter Description"
                placeholderTextColor={isDarkMode ? '#B0B0B0' : '#707070'}
                returnKeyType="next"
              />
            </View>

            <View className="mb-5">
              <Text style={fontStyles('bold')} className={labelClass}>Category</Text>
              <TouchableOpacity
                className={selectorClass}
                onPress={() => setShowCategoryModal(true)}
              >
                {categories.find(cat => cat.id === categoryId) ? (
                  <View className="flex-row items-center">
                    <View 
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        borderWidth: 2,
                        borderColor: categories.find(cat => cat.id === categoryId)?.color,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 15,
                      }}
                    >
                      <Text style={{ fontSize: 20, color: categories.find(cat => cat.id === categoryId)?.color }}>
                        {categories.find(cat => cat.id === categoryId)?.icon}
                      </Text>
                    </View>
                    <Text className={`ml-2 text-base ${isDarkMode ? 'text-white' : 'text-black'}`}>
                      {categories.find(cat => cat.id === categoryId)?.name}
                    </Text>
                  </View>
                ) : (
                  <Text className={placeholderClass + ' text-base'}>
                    Select category
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View className="mb-5">
              <Text style={fontStyles('bold')} className={labelClass}>Account</Text>
              <TouchableOpacity
                className={selectorClass}
                onPress={() => setShowAccountModal(true)}
              >
                {accounts.find(acc => acc.id === accountId) ? (
                  <View className="flex-row items-center">
                    <Text style={{ fontSize: 24, color: '#000' }}>
                      {accounts.find(acc => acc.id === accountId)?.icon}
                    </Text>
                    <View>
                      <Text className={`ml-2 text-base ${isDarkMode ? 'text-white' : 'text-black'}`}>
                        {accounts.find(acc => acc.id === accountId)?.name}
                      </Text>
                      <Text className="ml-2 text-sm text-slate-500">
                        Balance: ₹{accounts.find(acc => acc.id === accountId)?.balance}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <Text className={placeholderClass + ' text-base'}>
                    Select account
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
              <Text style={fontStyles('bold')} className={labelClass}>Note</Text>
              <TextInput
                ref={noteInputRef}
                className={`${inputClass} h-24`}
                style={{ textAlignVertical: 'top' }}
                value={note}
                onChangeText={setNote}
                placeholder="Add a note"
                placeholderTextColor={isDarkMode ? '#B0B0B0' : '#707070'}
                multiline
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

export default TransactionForm;