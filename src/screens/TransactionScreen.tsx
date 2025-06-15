import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import { Calendar, Search, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import fontStyles from '../utils/fontStyles';
import { getAllTransactions, getAllAccounts, getAllCategories } from '../../db/dbUtils';
import { Transaction } from '../../db/types';
import { format } from 'date-fns';

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type TransactionScreenNavigationProp = {
  navigate: (screen: 'AllTransactions' | 'TransactionDetail', params?: { id: string }) => void;
};

const TransactionScreen = () => {
  const navigation = useNavigation<TransactionScreenNavigationProp>();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [filter, setFilter] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<{ [key: string]: any }>({});
  const [categories, setCategories] = useState<{ [key: string]: any }>({});
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const loadData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const allTransactions = await getAllTransactions();
      const accountsData = await getAllAccounts();
      const categoriesData = await getAllCategories();
      
      // Create lookup maps for accounts and categories
      const accountsMap = accountsData.reduce((acc: { [key: string]: any }, account) => {
        acc[account.id] = account;
        return acc;
      }, {});
      
      const categoriesMap = categoriesData.reduce((acc: { [key: string]: any }, category) => {
        acc[category.id] = category;
        return acc;
      }, {});
      
      let filteredTransactions;
      if (viewMode === 'week') {
        // Filter transactions for the selected date in week view
        const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
        filteredTransactions = allTransactions.filter(t => 
          format(new Date(t.date), 'yyyy-MM-dd') === selectedDateStr
        );
      } else {
        // Filter transactions for the entire month in month view
        const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
        
        filteredTransactions = allTransactions.filter(t => {
          const transactionDate = new Date(t.date);
          return transactionDate >= startOfMonth && transactionDate <= endOfMonth;
        });
      }
      
      // Calculate summary
      const summaryData = {
        income: filteredTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0),
        expense: filteredTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0),
        balance: 0
      };
      summaryData.balance = summaryData.income - summaryData.expense;
      
      setTransactions(filteredTransactions);
      setAccounts(accountsMap);
      setCategories(categoriesMap);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, viewMode, user]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [loadData, lastUpdate]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      return () => {};
    }, [loadData])
  );

  const handlePrev = () => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'week') {
      newDate.setDate(selectedDate.getDate() - 7);
    } else {
      newDate.setMonth(selectedDate.getMonth() - 1);
    }
    setSelectedDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'week') {
      newDate.setDate(selectedDate.getDate() + 7);
    } else {
      newDate.setMonth(selectedDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'week' ? 'month' : 'week');
    // Reset to first day of month when switching to month view
    if (viewMode === 'week') {
      const newDate = new Date(selectedDate);
      newDate.setDate(1);
      setSelectedDate(newDate);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'transfer') return t.type === 'debit' || t.type === 'credit';
    return t.type === filter;
  });

  const getTransactionTitle = (transaction: Transaction) => {
    // If there's a title, show it
    if (transaction.title) {
      return transaction.title;
    }

    const isTransfer = transaction.type === 'debit' || transaction.type === 'credit';
    if (isTransfer) {
      const linkedTransaction = transactions.find(t => t.id === transaction.linkedTransactionId);
      const transferAccount = linkedTransaction ? accounts[linkedTransaction.accountId] : null;
      
      if (transaction.type === 'debit') {
        return `Transfer to ${transferAccount?.name || 'Unknown Account'}`;
      }
      if (transaction.type === 'credit') {
        return `Transfer from ${transferAccount?.name || 'Unknown Account'}`;
      }
    }
    return categories[transaction.categoryId]?.name || 'Unknown Category';
  };

  const renderWeekDays = () => {
    const startDate = new Date(selectedDate);
    startDate.setDate(selectedDate.getDate() - selectedDate.getDay());
    
    return weekDays.map((day, idx) => {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + idx);
      const isSelected = currentDate.toDateString() === selectedDate.toDateString();
      
      return (
        <TouchableOpacity 
          key={day} 
          className={`items-center flex-1 py-2 rounded-[20px] ${isSelected ? 'bg-sky-500' : ''}`}
          onPress={() => setSelectedDate(currentDate)}
        >
          <Text style={fontStyles('semibold')} className={`text-xs ${isSelected ? 'text-white' : isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {day}
          </Text>
          <Text style={fontStyles('extrabold')} className={`text-base ${isSelected ? 'text-white' : isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {currentDate.getDate()}
          </Text>
        </TouchableOpacity>
      );
    });
  };

  return (
    <SafeAreaView className={`flex-1 pb-20 ${isDarkMode ? 'bg-BackgroundDark' : 'bg-white'}`}>
      <View className="flex-1 pb-10">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-8 pb-4">
          <Text style={fontStyles('extrabold')} className={`text-4xl ${isDarkMode ? 'text-white' : 'text-black'}`}>Transactions</Text>
          <View className="flex-row items-center gap-4">
            <TouchableOpacity onPress={toggleViewMode}>
              <Calendar color={isDarkMode ? "#fff" : "#000"} size={24} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('AllTransactions')}>
              <Search color={isDarkMode ? "#fff" : "#000"} size={24} />
            </TouchableOpacity>
          </View>
        </View>
        {/* Date Selector */}
        <View className="flex-row items-center justify-between mt-4 px-6 pb-4">
          <TouchableOpacity onPress={handlePrev}>
            <ChevronLeft color={isDarkMode ? "#fff" : "#000"} size={24} />
          </TouchableOpacity>
          <Text style={fontStyles('extrabold')} className={`text-lg ${isDarkMode ? 'text-white' : 'text-black'}`}>
            {format(selectedDate, viewMode === 'week' ? 'MMM d, yyyy' : 'MMMM yyyy')}
          </Text>
          <TouchableOpacity onPress={handleNext}>
            <ChevronRight color={isDarkMode ? "#fff" : "#000"} size={24} />
          </TouchableOpacity>
        </View>
        {/* Week View */}
        {viewMode === 'week' && (
          <View className="flex-row justify-between px-6 pb-2">
            {renderWeekDays()}
          </View>
        )}
        {/* Filter Toggle */}
        <View className="flex-row justify-between px-6 py-2 gap-2">
          {['all', 'income', 'expense', 'transfer'].map(type => (
            <TouchableOpacity
              key={type}
              className={`flex-1 py-2 rounded-[20px] items-center ${filter === type ? 'bg-sky-500' : isDarkMode ? 'bg-slate-800' : 'bg-gray-200'}`}
              onPress={() => setFilter(type as any)}
            >
              <Text style={fontStyles('semibold')} className={`${filter === type ? 'text-white' : isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Transaction List */}
        <FlatList
          data={filteredTransactions}
          keyExtractor={item => item.id}
          className="px-4 mt-2"
          renderItem={({ item }) => {
            const account = accounts[item.accountId];
            const category = categories[item.categoryId];
            const isTransfer = item.type === 'debit' || item.type === 'credit';
            
            return (
            <TouchableOpacity
              className={`flex-row items-center justify-between ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'} rounded-2xl px-4 py-3 mb-3`}
              onPress={() => navigation.navigate('TransactionDetail', { id: item.id })}
            >
              <View>
                <Text style={fontStyles('semibold')} className={`text-base ${isDarkMode ? 'text-white' : 'text-black'}`} numberOfLines={1}>
                    {getTransactionTitle(item)}
                </Text>
                <Text style={fontStyles('regular')} className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {!isTransfer && category?.name ? `${category.name} • ` : ''}{account?.name || 'Unknown Account'}
                </Text>
              </View>
              <View>
                  <Text style={fontStyles('extrabold')} className={`text-lg ${
                    item.type === 'income' || item.type === 'credit' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    ₹{item.amount.toLocaleString()}
                </Text>
                <Text style={fontStyles('regular')} className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-right`}>
                  {format(new Date(item.date), 'd MMM')}
                </Text>
              </View>
            </TouchableOpacity>
            );
          }}
        />
        {/* Summary */}
        <View className={`flex-row justify-between items-center ${isDarkMode ? 'bg-slate-800' : 'bg-gray-100'} rounded-2xl px-6 py-6 mx-4 mt-2`}>
          <View className="items-center">
            <Text style={fontStyles('semibold')} className={`text-base ${isDarkMode ? 'text-white' : 'text-black'}`}>
              {viewMode === 'week' ? 'Day Income' : 'Month Income'}
            </Text>
            <Text style={fontStyles('extrabold')} className="text-green-500 text-2xl">₹{summary.income}</Text>
          </View>
          <View className="items-center">
            <Text style={fontStyles('semibold')} className={`text-base ${isDarkMode ? 'text-white' : 'text-black'}`}>
              {viewMode === 'week' ? 'Day Expense' : 'Month Expense'}
            </Text>
            <Text style={fontStyles('extrabold')} className="text-red-500 text-2xl">₹{summary.expense}</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default TransactionScreen;