import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View } from 'react-native';
import { Home, List, PieChart, Sparkles, PiggyBank } from 'lucide-react-native';
import HomeScreen from '../screens/HomeScreen';
import StatsScreen from '../screens/StatsScreen';
import AIScreen from '../screens/AIScreen';
import TransactionScreen from '../screens/TransactionScreen';
import BudgetScreen from '../screens/BudgetScreen';
import { useTheme } from '../contexts/ThemeContext';
import { MainTabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabsNavigator() {
  const { isDarkMode } = useTheme();

  return (
    <View className={`flex-1 ${isDarkMode ? 'bg-BackgroundDark' : 'bg-Background'}`}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: isDarkMode ? '#1E293B' : '#F5F5F5',
            borderColor: isDarkMode ? '#334155' : '#E2E8F0',
            borderTopWidth: 2,
            borderTopLeftRadius: 5,
            height: 80,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingTop: 10,
            paddingHorizontal: 20,
            justifyContent: 'center',
            alignItems: 'center',
          },
          tabBarActiveTintColor: isDarkMode ? '#0ea5e9' : '#0ea5e9',
          tabBarInactiveTintColor: isDarkMode ? '#B0B0B0' : '#707070',
          tabBarShowLabel: true,
          tabBarItemStyle: {
            justifyContent: 'center',
          },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color }) => <Home color={color} size={24} />,
          }}
        />
        <Tab.Screen
          name="Transactions"
          component={TransactionScreen}
          options={{
            tabBarIcon: ({ color }) => <List color={color} size={24} />,
          }}
        />
        <Tab.Screen
          name="Budget"
          component={BudgetScreen}
          options={{
            tabBarIcon: ({ color }) => <PiggyBank color={color} size={24} />,
          }}
        />
        <Tab.Screen
          name="Stats"
          component={StatsScreen}
          options={{
            tabBarIcon: ({ color }) => <PieChart color={color} size={24} />,
          }}
        />
        <Tab.Screen
          name="AI"
          component={AIScreen}
          options={{
            tabBarIcon: ({ color }) => <Sparkles color={color} size={24} />,
          }}
        />
      </Tab.Navigator>
    </View>
  );
}
