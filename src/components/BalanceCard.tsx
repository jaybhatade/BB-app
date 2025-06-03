import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet  } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import fontStyles  from '../utils/fontStyles'
import { getAllTransactions } from '../../db/transaction-management';
import { useAuth } from '../contexts/AuthContext';
import { CalendarDays } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface BalanceCardProps {
  onAccountsUpdate?: () => void;
}

export default function BalanceCard({ onAccountsUpdate }: BalanceCardProps) {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [netBalance, setNetBalance] = useState(0);
  const [currentMonth, setCurrentMonth] = useState('');
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const fetchTransactionSummary = useCallback(async () => {
    if (!user) return;

    try {
      const transactions = await getAllTransactions();

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const currentMonthTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= startOfMonth && transactionDate <= endOfMonth;
      });

      const income = currentMonthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = currentMonthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      setMonthlyIncome(income);
      setMonthlyExpenses(expenses);
      setNetBalance(income - expenses);

      setCurrentMonth(now.toLocaleString('default', { month: 'long' }));

      if (onAccountsUpdate) {
        onAccountsUpdate();
      }
    } catch (error) {
      console.error('Error fetching transaction summary:', error);
    }
  }, [user, onAccountsUpdate]);

  useEffect(() => {
    fetchTransactionSummary();
  }, [fetchTransactionSummary, lastUpdate]);

  useFocusEffect(
    useCallback(() => {
      fetchTransactionSummary();
      return () => {};
    }, [fetchTransactionSummary])
  );

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <View
      className={`mx-4 mt-8 mb-8`}
      style={{ gap: 16 }}
    >
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <View
          style={{ flex: 1 }}
          className={`rounded-[20px] p-6 ${isDarkMode ? 'bg-[#374151]' : 'bg-[#e5e7eb]'}`}
        >
          <Text style={fontStyles('semibold')} className={`text-base mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>Total Income</Text>
          <Text style={fontStyles('extrabold')} className={`text-3xl ${isDarkMode ? 'text-white' : 'text-black'}`}>{formatCurrency(monthlyIncome)}</Text>
        </View>
        <View
          style={{ flex: 1 }}
          className={`rounded-[20px] p-6 ${isDarkMode ? 'bg-[#374151]' : 'bg-[#e5e7eb]'}`}
        >
          <Text style={fontStyles('semibold')} className={`text-base mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>Total Expenses</Text>
          <Text style={fontStyles('extrabold')} className={`text-3xl text-red-400`}>{formatCurrency(monthlyExpenses)}</Text>
        </View>
      </View>
      <View
        className={`rounded-[20px] p-6 ${isDarkMode ? 'bg-[#374151]' : 'bg-[#e5e7eb]'}`}
        style={{ alignItems: 'flex-start' }}
      >
        <Text style={fontStyles('semibold')} className={`text-base mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}>Remaining Balance</Text>
        <Text style={fontStyles('extrabold')} className={`text-3xl ${isDarkMode ? 'text-white' : 'text-black'}`}>{formatCurrency(netBalance)}</Text>
      </View>
    </View>
  );
}
