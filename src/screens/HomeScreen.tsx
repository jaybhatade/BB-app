import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Animated, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, MainTabParamList } from '../types/navigation';

import { Menu, Bell, Plus } from 'lucide-react-native';
import RecentTransactions from '../components/RecentTransactions';
import BudgetListCards from '../components/BudgetComponents/BudgetListCards';
import BalanceCard from '../components/BalanceCard';
import BudgetPieChart from '../components/BudgetComponents/BudgetPieChart';
import { useDatabase } from '../contexts/DatabaseContext';
import { useAuth } from '../contexts/AuthContext';
import * as db from '../../db/dbUtils';
import fontStyles  from '../utils/fontStyles'
import DemoSpendingChart from '../components/Charts/DemoSpendingChart';
import IncomeVsExpenseChart from '../components/Charts/IncomeVsExpenseChart';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { isDarkMode } = useTheme();
  const { isInitialized } = useDatabase();
  const { user } = useAuth();
  const scrollY = useRef(new Animated.Value(0)).current;
  const [refreshKey, setRefreshKey] = useState(0);
  const [userDetails, setUserDetails] = useState<{firstName: string, lastName: string} | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (user) {
        const dbUser = await db.getUserByUserId(user.uid);
        if (dbUser) {
          setUserDetails({
            firstName: dbUser.firstName,
            lastName: dbUser.lastName
          });
        }
      }
    };

    fetchUserDetails();
  }, [user]);

  const handleAccountsUpdate = () => {
    setRefreshKey(prev => prev + 1);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setRefreshKey(prev => prev + 1);
    
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const getInitials = () => {
    if (userDetails) {
      return `${userDetails.firstName[0]}${userDetails.lastName[0]}`;
    }
    return '';
  };

  const renderHeader = () => (
    <View className="pt-2">
      <View className="flex-row justify-between items-center px-6 mb-2">
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
          className="w-10 h-10 items-center justify-center"
        >
          <Menu size={28} color={isDarkMode ? '#FFFFFF' : '#000000'} />
        </TouchableOpacity>
        <Text style={fontStyles('extrabold')} className={`text-xl  ${isDarkMode ? '  text-white' : 'text-black'}`}>Overview</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Notifications')}
          className="w-10 h-10 items-center justify-center"
        >
          <Bell size={24} color={isDarkMode ? '#FFFFFF' : '#000000'} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView className={`flex-1 ${isDarkMode ? 'bg-BackgroundDark' : 'bg-Background'}`} edges={['top']}>
      {renderHeader()}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDarkMode ? '#FFFFFF' : '#000000'}
          />
        }
      >
        <BalanceCard onAccountsUpdate={handleAccountsUpdate} />
        <DemoSpendingChart />
        <IncomeVsExpenseChart />
      </ScrollView>
      
      <TouchableOpacity
        onPress={() => navigation.navigate('Add')}
        className="absolute right-8 bottom-[110px] w-14 h-14 rounded-full bg-[#0ea5e9] items-center justify-center shadow-lg"
        style={{
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        }}
      >
        <Plus size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}