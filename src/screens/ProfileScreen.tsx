import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import fontStyles from '../utils/fontStyles';
import { clearDatabase } from '../../db/database-core';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [isThemeModalVisible, setIsThemeModalVisible] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout? This will clear all your local data.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear all local database data
              await clearDatabase();
              // Sign out from authentication
              await signOut();
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  const menuItems = [
    {
      title: 'Email',
      icon: 'mail-outline',
      onPress: () => {},
      value: user?.email || 'Not set'
    },
    {
      title: 'Manage Categories',
      icon: 'list-outline',
      onPress: () => navigation.navigate('ManageCategories'),
    },
    {
      title: 'Manage Accounts',
      icon: 'wallet-outline',
      onPress: () => navigation.navigate('ManageAccounts'),
    },
    {
      title: 'All Transactions',
      icon: 'receipt-outline',
      onPress: () => navigation.navigate('AllTransactions'),
    },
    {
      title: 'Database',
      icon: 'server-outline',
      onPress: () => navigation.navigate('Database'),
    },
    {
      title: 'Theme',
      icon: isDarkMode ? 'moon' : 'sunny',
      onPress: () => setIsThemeModalVisible(true),
    },
    {
      title: 'Logout',
      icon: 'log-out-outline',
      onPress: handleLogout,
    },
  ];

  const ThemeSelectionModal = () => (
    <Modal
      visible={isThemeModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setIsThemeModalVisible(false)}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => setIsThemeModalVisible(false)}
        className="flex-1 justify-center items-center bg-black/50"
      >
        <View
          className={`p-6 rounded-3xl w-[80%] ${
            isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
          }`}
        >
          <Text
            style={fontStyles('bold')}
            className={`text-xl mb-6 ${
              isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
            }`}
          >
            Choose Theme
          </Text>

          <TouchableOpacity
            onPress={() => {
              if (isDarkMode) toggleTheme();
              setIsThemeModalVisible(false);
            }}
            className={`p-4 rounded-2xl mb-3 flex-row items-center ${
              !isDarkMode ? 'bg-Primary' : 'bg-transparent'
            }`}
          >
            <Ionicons
              name="sunny"
              size={24}
              color={!isDarkMode ? '#FFFFFF' : isDarkMode ? '#FFFFFF' : '#000000'}
            />
            <Text
              style={fontStyles('medium')}
              className={`ml-3 ${
                !isDarkMode ? 'text-white' : isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
              }`}
            >
              Light Theme
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (!isDarkMode) toggleTheme();
              setIsThemeModalVisible(false);
            }}
            className={`p-4 rounded-2xl flex-row items-center ${
              isDarkMode ? 'bg-Primary' : 'bg-transparent'
            }`}
          >
            <Ionicons
              name="moon"
              size={24}
              color={isDarkMode ? '#FFFFFF' : isDarkMode ? '#FFFFFF' : '#000000'}
            />
            <Text
              style={fontStyles('medium')}
              className={`ml-3 ${
                isDarkMode ? 'text-white' : isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
              }`}
            >
              Dark Theme
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView className={`flex-1 ${isDarkMode ? 'bg-BackgroundDark' : 'bg-Background'}`} edges={['top']}>
      <View className="px-6">
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={item.onPress}
              className={`p-4 rounded-xl mb-2 flex-row items-center justify-between ${
                isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
              }`}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name={item.icon as any}
                  size={24}
                  color={isDarkMode ? '#FFFFFF' : '#000000'}
                  className="mr-3"
                />
                <View>
                  <Text 
                    style={fontStyles('medium')}
                    className={`${
                      isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                    }`}
                  >
                    {item.title}
                  </Text>
                  {item.value && (
                    <Text 
                      style={fontStyles('regular')}
                      className={`text-sm ${
                        isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
                      }`}
                    >
                      {item.value}
                    </Text>
                  )}
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={24}
                color={isDarkMode ? '#FFFFFF' : '#000000'}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <ThemeSelectionModal />
    </SafeAreaView>
  );
}