import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons, Octicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import db from '../../db/database-core';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Account {
  id: string;
  userId: string;
  name: string;
  balance: number;
  icon: string;
  createdAt: string;
  updatedAt: string;
  synced?: number;
}

export default function ManageAccountsScreen() {
  const { user } = useAuth();
  const userId = user?.uid || '';
  const { isDarkMode } = useTheme();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    balance: '',
    icon: '🏛️',
    color: '#21965B',
  });

  // Available account icons as emojis
  const accountIcons = [
    { icon: '🏛️', label: 'Bank' },
    { icon: '💵', label: 'Cash' },
    { icon: '💳', label: 'Card' },
    { icon: '🐷', label: 'Savings' },
    { icon: '👛', label: 'Wallet' },
    { icon: '📈', label: 'Investment' },
  ];

  const loadAccounts = useCallback(async () => {
    try {
      const result = await db.getAllAsync<Account>(
        `SELECT * FROM accounts WHERE userId = ? ORDER BY id`,
        [userId]
      );
      setAccounts(result);
    } catch (error) {
      console.error('Error loading accounts:', error);
      Alert.alert('Error', 'Failed to load accounts');
    }
  }, [userId]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleAddAccount = async () => {
    try {
      if (!formData.name.trim()) {
        Alert.alert('Error', 'Please enter an account name');
        return;
      }

      if (!formData.balance.trim()) {
        Alert.alert('Error', 'Please enter an account balance');
        return;
      }

      const now = new Date().toISOString();
      const id = `acc_${Date.now()}`;

      await db.runAsync(
        `INSERT INTO accounts (id, userId, name, balance, icon, createdAt, updatedAt, synced)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, userId, formData.name, parseFloat(formData.balance), formData.icon, now, now, 0]
      );
      
      await loadAccounts();
      closeModal();
    } catch (error) {
      console.error('Error adding account:', error);
      Alert.alert('Error', 'Failed to add account');
    }
  };

  const handleEditAccount = async () => {
    if (!editingAccount) return;

    try {
      const now = new Date().toISOString();
      await db.runAsync(
        `UPDATE accounts 
         SET name = ?, balance = ?, icon = ?, updatedAt = ?
         WHERE id = ?`,
        [formData.name, parseFloat(formData.balance), formData.icon, now, editingAccount.id]
      );
      await loadAccounts();
      closeModal();
    } catch (error) {
      console.error('Error updating account:', error);
      Alert.alert('Error', 'Failed to update account');
    }
  };

  const handleDeleteAccount = async (id: string) => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete this account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.runAsync('DELETE FROM accounts WHERE id = ?', [id]);
              await loadAccounts();
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      name: '',
      balance: '',
      icon: '🏛️',
      color: '#21965B'
    });
  };

  const openEditModal = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      balance: account.balance.toString(),
      icon: account.icon,
      color: '#21965B',
    });
    setIsModalVisible(true);
  };

  const openAddModal = () => {
    setEditingAccount(null);
    resetForm();
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setEditingAccount(null);
    resetForm();
  };

  const renderItem = ({ item }: { item: Account }) => (
    <View className={`p-4 rounded-xl mb-3 flex-row items-center justify-between ${
      isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
    }`}>
      <View className="flex-row items-center flex-1">
        <View 
          className="w-12 h-12 rounded-full items-center justify-center mr-4"
          style={{ backgroundColor: '#21965B' }}
        >
          <Text className="text-2xl">{item.icon}</Text>
        </View>
        <View className="flex-1">
          <Text className={`font-montserrat-medium text-lg ${
            isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
          }`}>
            {item.name}
          </Text>
          <Text className={`font-montserrat text-sm ${
            isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
          }`}>
            ₹{item.balance}
          </Text>
        </View>
      </View>
      <View className="flex-row">
        <TouchableOpacity
          onPress={() => openEditModal(item)}
          className="mr-4"
        >
          <Octicons
            name="pencil"
            size={24}
            color={isDarkMode ? '#FFFFFF' : '#000000'}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDeleteAccount(item.id)}>
          <Ionicons
            name="trash-outline"
            size={24}
            color={isDarkMode ? '#FFFFFF' : '#000000'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const EmptyListComponent = () => (
    <View className="flex-1 items-center justify-center">
      <Ionicons
        name="wallet-outline"
        size={80}
        color={isDarkMode ? '#666666' : '#999999'}
      />
      <Text className={`mt-4 text-lg font-montserrat-medium text-center ${
        isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
      }`}>
        No accounts yet
      </Text>
      <Text className={`mt-2 text-sm font-montserrat text-center ${
        isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
      }`}>
        Add an account to get started
      </Text>
    </View>
  );

  return (
    <SafeAreaView className={`flex-1 ${isDarkMode ? 'bg-BackgroundDark' : 'bg-Background'}`} edges={['top']}>
      <View className="px-6 pb-6 flex-1">
        <FlatList
          data={accounts}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={EmptyListComponent}
          contentContainerStyle={{ flexGrow: 1 }}
        />
      </View>

      <TouchableOpacity
        onPress={openAddModal}
        className={`absolute bottom-8 right-8 w-14 h-14 rounded-full items-center justify-center ${
          isDarkMode ? 'bg-PrimaryDark' : 'bg-Primary'
        }`}
        style={{ elevation: 5 }}
      >
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={closeModal}
          className="flex-1 justify-end bg-black/50"
        >
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={e => e.stopPropagation()}
            className={`rounded-t-3xl ${
              isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
            }`}
          >
            <ScrollView 
              showsVerticalScrollIndicator={false}
              className="p-6"
            >
              <Text className={`text-xl font-montserrat-bold mb-6 ${
                isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
              }`}>
                {editingAccount ? 'Edit Account' : 'Add New Account'}
              </Text>

              <View className="flex-row items-center mb-6">
                <View 
                  className="w-16 h-16 rounded-xl items-center justify-center mr-4"
                  style={{ backgroundColor: formData.color }}
                >
                  <Text style={{ fontSize: 24, color: '#FFFFFF' }}>
                    {formData.icon}
                  </Text>
                </View>
                <View className="flex-1">
                  <TextInput
                    className={`p-4 rounded-lg ${
                      isDarkMode 
                        ? 'bg-BackgroundDark text-TextPrimaryDark' 
                        : 'bg-white text-TextPrimary'
                    }`}
                    placeholder="Account Name"
                    placeholderTextColor={isDarkMode ? '#B0B0B0' : '#707070'}
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                  />
                </View>
              </View>

              <TextInput
                className={`p-4 rounded-lg mb-6 ${
                  isDarkMode 
                    ? 'bg-BackgroundDark text-TextPrimaryDark' 
                    : 'bg-white text-TextPrimary'
                }`}
                placeholder="Initial Balance"
                placeholderTextColor={isDarkMode ? '#B0B0B0' : '#707070'}
                value={formData.balance}
                onChangeText={(text) => {
                  // Allow only numbers and decimal point
                  if (/^\d*\.?\d*$/.test(text) || text === '') {
                    setFormData({ ...formData, balance: text });
                  }
                }}
                keyboardType="decimal-pad"
              />

              <Text className={`font-montserrat-medium mb-3 ${
                isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
              }`}>
                Account Type
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                className="mb-6"
              >
                <View className="flex-row">
                  {accountIcons.map((icon) => (
                    <TouchableOpacity
                      key={icon.icon}
                      onPress={() => setFormData(prev => ({ ...prev, icon: icon.icon }))}
                      className={`w-20 h-20 rounded-xl items-center justify-center mr-3 ${
                        formData.icon === icon.icon
                          ? isDarkMode ? 'bg-PrimaryDark' : 'bg-Primary'
                          : isDarkMode ? 'bg-BackgroundDark' : 'bg-white'
                      }`}
                    >
                      <Text style={{ fontSize: 24 }}>
                        {icon.icon}
                      </Text>
                      <Text className={`text-xs mt-2 ${
                        formData.icon === icon.icon
                          ? 'text-white'
                          : isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                      }`}>
                        {icon.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View className="flex-row justify-between mb-4">
                <TouchableOpacity
                  onPress={closeModal}
                  className={`p-4 rounded-lg flex-1 mr-2 ${
                    isDarkMode ? 'bg-BackgroundDark' : 'bg-white'
                  }`}
                >
                  <Text className={`text-center font-montserrat-semibold ${
                    isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                  }`}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={editingAccount ? handleEditAccount : handleAddAccount}
                  className={`p-4 rounded-lg flex-1 ml-2 ${
                    isDarkMode ? 'bg-PrimaryDark' : 'bg-Primary'
                  }`}
                >
                  <Text className="text-white text-center font-montserrat-semibold">
                    {editingAccount ? 'Update' : 'Add'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}