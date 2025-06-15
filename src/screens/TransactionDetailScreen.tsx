import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { ChevronLeft, Trash2, Calendar, Wallet, ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import fontStyles from '../utils/fontStyles';
import { getTransactionById, deleteTransaction } from '../../db/transaction-management';
import { getAccountById } from '../../db/account-management';
import { getCategoryById } from '../../db/category-management';
import { Transaction } from '../../db/types';
import { format } from 'date-fns';

const TransactionDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params as { id: string };
  const { isDarkMode } = useTheme();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [accountName, setAccountName] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState<string | null>(null);

  const loadTransaction = useCallback(async () => {
    try {
      const fetchedTransaction = await getTransactionById(id);
      if (fetchedTransaction) {
        setTransaction(fetchedTransaction);
        // Fetch related account and category names
        if (fetchedTransaction.accountId) {
          const account = await getAccountById(fetchedTransaction.accountId);
          setAccountName(account?.name || 'Unknown Account');
        }
        if (fetchedTransaction.categoryId) {
          const category = await getCategoryById(fetchedTransaction.categoryId);
          setCategoryName(category?.name || 'Unknown Category');
        }
      }
    } catch (error) {
      console.error('Error loading transaction:', error);
    }
  }, [id]);

  useEffect(() => {
    loadTransaction();
  }, [loadTransaction]);

  const handleDelete = async () => {
    try {
      await deleteTransaction(id);
      navigation.goBack();
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const getTransactionIcon = (transaction: Transaction) => {
    if (transaction.type === 'income' || transaction.type === 'credit') {
      return <ArrowDownLeft color="#22c55e" size={32} />;
    } else if (transaction.type === 'expense' || transaction.type === 'debit') {
      return <ArrowUpRight color="#ef4444" size={32} />;
    }
    return <Text className="text-white text-xl">?</Text>;
  };

  const getTransactionColor = (transaction: Transaction) => {
    if (transaction.type === 'income' || transaction.type === 'credit') {
      return 'text-green-500';
    } else if (transaction.type === 'expense' || transaction.type === 'debit') {
      return 'text-red-500';
    }
    return 'text-white';
  };

  if (!transaction) {
    return (
      <SafeAreaView className={`flex-1 ${isDarkMode ? 'bg-BackgroundDark' : 'bg-Background'}`}>
        <View className="flex-1 items-center justify-center">
          <Text style={fontStyles('regular')} className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDarkMode ? 'bg-BackgroundDark' : 'bg-Background'}`}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 pt-8 pb-4">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft color={isDarkMode ? "#fff" : "#000"} size={24} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete}>
          <Trash2 color="#ff0000" size={24} />
        </TouchableOpacity>
      </View>

      {/* Transaction Details */}
      <View className="flex-1 px-6 mt-8">
        <View className="items-center">
          <View className={`w-16 h-16 rounded-full ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'} items-center justify-center`}>
            {getTransactionIcon(transaction)}
          </View>
          <Text style={fontStyles('extrabold')} className={`${getTransactionColor(transaction)} text-4xl mt-4`}>
            {transaction.type === 'income' || transaction.type === 'credit' ? '+₹' : '-₹'}{transaction.amount.toLocaleString()}
          </Text>
          <Text style={fontStyles('semibold')} className={`${isDarkMode ? 'text-white' : 'text-black'} text-lg mt-1`}>{transaction.title || categoryName || 'Unknown'}</Text>
        </View>

        {/* Details List */}
        <View className="mt-8">
          <View className={`flex-row items-center justify-between py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <View className="flex-row items-center">
              <Calendar color={isDarkMode ? "#fff" : "#000"} size={20} />
              <Text style={fontStyles('semibold')} className={`${isDarkMode ? 'text-white' : 'text-black'} text-base ml-3`}>Date</Text>
            </View>
            <Text style={fontStyles('regular')} className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} text-base`}>{format(new Date(transaction.date), 'd MMM yyyy')}</Text>
          </View>

          <View className={`flex-row items-center justify-between py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <View className="flex-row items-center">
              <Wallet color={isDarkMode ? "#fff" : "#000"} size={20} />
              <Text style={fontStyles('semibold')} className={`${isDarkMode ? 'text-white' : 'text-black'} text-base ml-3`}>Account</Text>
            </View>
            <Text style={fontStyles('regular')} className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} text-base`}>{accountName || 'Unknown Account'}</Text>
          </View>

          <View className="py-3">
            <Text style={fontStyles('semibold')} className={`${isDarkMode ? 'text-white' : 'text-black'} text-base`}>Note:</Text>
            <Text style={fontStyles('regular')} className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} text-base mt-1`}>{transaction.notes || 'No notes provided.'}</Text>
          </View>
        </View>

        {/* Tags */}
        <View className="flex-row mt-8 gap-2">
          {transaction.type === 'income' && (
            <View className="px-4 py-2 rounded-full bg-green-600">
              <Text style={fontStyles('semibold')} className="text-white text-xs">Income</Text>
            </View>
          )}
          {transaction.type === 'expense' && (
            <View className="px-4 py-2 rounded-full bg-red-600">
              <Text style={fontStyles('semibold')} className="text-white text-xs">Expense</Text>
            </View>
          )}
          {transaction.type === 'debit' && (
            <View className="px-4 py-2 rounded-full bg-blue-600">
              <Text style={fontStyles('semibold')} className="text-white text-xs">Transfer Out</Text>
            </View>
          )}
          {transaction.type === 'credit' && (
            <View className="px-4 py-2 rounded-full bg-blue-600">
              <Text style={fontStyles('semibold')} className="text-white text-xs">Transfer In</Text>
            </View>
          )}
        </View>
      </View>

      {/* Footer */}
      <View className="items-center mb-4">
        <Text style={fontStyles('regular')} className={`${isDarkMode ? 'text-gray-500' : 'text-gray-400'} text-sm`}>created with Bloom Budget</Text>
      </View>
    </SafeAreaView>
  );
};

export default TransactionDetailScreen; 