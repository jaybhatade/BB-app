import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { 
  getAllTransactions, 
  getAllAccounts, 
  getAllBudgets, 
  getAllCategories,
  getAllSubscriptions,
  getAllGoals,
  getAllUsers
} from '../../db/dbUtils';
import { Ionicons } from '@expo/vector-icons';

interface DatabaseData {
  transactions: any[];
  accounts: any[];
  budgets: any[];
  categories: any[];
  subscriptions: any[];
  goals: any[];
  users: any[];
}

export default function DatabaseScreen() {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DatabaseData>({
    transactions: [],
    accounts: [],
    budgets: [],
    categories: [],
    subscriptions: [],
    goals: [],
    users: []
  });
  const [activeTab, setActiveTab] = useState('transactions');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const transactions = await getAllTransactions();
        const accounts = await getAllAccounts();
        const budgets = await getAllBudgets();
        const categories = await getAllCategories();
        const subscriptions = await getAllSubscriptions();
        const goals = await getAllGoals();
        const users = await getAllUsers();

        setData({
          transactions,
          accounts,
          budgets,
          categories,
          subscriptions,
          goals,
          users
        });
      } catch (error) {
        console.error('Error fetching database data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      const transactions = await getAllTransactions();
      const accounts = await getAllAccounts();
      const budgets = await getAllBudgets();
      const categories = await getAllCategories();
      const subscriptions = await getAllSubscriptions();
      const goals = await getAllGoals();
      const users = await getAllUsers();
      setData({
        transactions,
        accounts,
        budgets,
        categories,
        subscriptions,
        goals,
        users
      });
    } catch (error) {
      console.error('Error refreshing database data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderTabBar = () => {
    const tabs = [
      { id: 'transactions', label: 'Transactions' },
      { id: 'accounts', label: 'Accounts' },
      { id: 'categories', label: 'Categories' },
      { id: 'budgets', label: 'Budgets' },
      { id: 'subscriptions', label: 'Subscriptions' },
      { id: 'goals', label: 'Goals' },
      { id: 'users', label: 'Users' },
    ];

    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="mb-4"
      >
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            className={`px-4 py-2 mx-1 rounded-full ${
              activeTab === tab.id
                ? isDarkMode ? 'bg-AccentDark' : 'bg-Accent'
                : isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
            }`}
          >
            <Text
              className={`${
                activeTab === tab.id
                  ? 'text-white font-montserrat-bold'
                  : isDarkMode ? 'text-TextPrimaryDark font-montserrat' : 'text-TextPrimary font-montserrat'
              }`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  const renderDataItem = (item: any, index: number) => {
    return (
      <View
        key={index}
        className={`p-4 mb-2 rounded-xl ${
          isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
        }`}
      >
        {Object.entries(item).map(([key, value]) => (
          <Text
            key={key}
            className={`font-montserrat ${
              isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
            }`}
          >
            <Text className="font-montserrat-bold">{key}: </Text>
            {String(value)}
          </Text>
        ))}
      </View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={isDarkMode ? '#FFFFFF' : '#000000'} />
        </View>
      );
    }

    const currentData = data[activeTab as keyof DatabaseData] || [];

    if (currentData.length === 0) {
      return (
        <View className="flex-1 justify-center items-center p-4">
          <Text
            className={`text-lg font-montserrat-medium ${
              isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
            }`}
          >
            No data in this table
          </Text>
        </View>
      );
    }

    return (
      <ScrollView>
        <Text 
          className={`mb-2 text-lg font-montserrat-bold px-2 ${
            isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
          }`}
        >
          {currentData.length} {activeTab} found
        </Text>
        {currentData.map(renderDataItem)}
      </ScrollView>
    );
  };

  return (
    <View className={`flex-1 ${isDarkMode ? 'bg-BackgroundDark' : 'bg-Background'}`}>
      <View className="px-6 pt-12 pb-6">
        <View className="flex-row justify-end items-center mb-2">
          <TouchableOpacity
            onPress={handleRefresh}
            disabled={loading}
            className={`p-2 rounded-full ${isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'}`}
          >
            {loading ? (
              <ActivityIndicator size="small" color={isDarkMode ? '#FFFFFF' : '#000000'} />
            ) : (
              <Ionicons name="refresh" size={24} color={isDarkMode ? '#FFFFFF' : '#000000'} />
            )}
          </TouchableOpacity>
        </View>
        {renderTabBar()}
        {renderContent()}
      </View>
    </View>
  );
} 