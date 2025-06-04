import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Modal, TextInput } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { Goal } from '../../db/types';
import * as db from '../../db/dbUtils';
import { ArrowLeft, Trash2, Calendar, Target, Wallet, CheckCircle } from 'lucide-react-native';
import fontStyles from '../utils/fontStyles';
import { SafeAreaView } from 'react-native-safe-area-context';

type GoalDetailsRouteProp = RouteProp<RootStackParamList, 'GoalDetails'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Account {
  id: string;
  name: string;
  balance: number;
  icon: string;
}

export default function GoalDetailsScreen() {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<GoalDetailsRouteProp>();
  const { goalId } = route.params;
  
  const [goal, setGoal] = useState<Goal | null>(null);
  const [progress, setProgress] = useState({
    currentAmount: 0,
    percentComplete: 0,
    daysRemaining: 0,
    isOnTrack: false,
    projectedCompletion: ''
  });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [showAccountModal, setShowAccountModal] = useState(false);

  useEffect(() => {
    loadGoalDetails();
    loadAccounts();
  }, [goalId]);

  const loadAccounts = async () => {
    try {
      const userAccounts = await db.getAccountsByUserId(user?.uid || '');
      // Filter out the goal's account
      const filteredAccounts = userAccounts.filter(acc => acc.id !== goal?.accountId);
      setAccounts(filteredAccounts);
    } catch (error) {
      console.error('Error loading accounts:', error);
      Alert.alert('Error', 'Failed to load accounts');
    }
  };

  const loadGoalDetails = async () => {
    try {
      const goalData = await db.getGoalById(goalId);
      if (goalData) {
        setGoal(goalData);
        const progressData = await db.calculateGoalProgress(goalId);
        setProgress(progressData);
      }
    } catch (error) {
      console.error('Error loading goal details:', error);
      Alert.alert('Error', 'Failed to load goal details');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal? This will also delete the associated account and all its transactions.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (goal) {
                // Get all transactions for the goal account
                const transactions = await db.getTransactionsByAccountId(goal.accountId);
                
                // Delete each transaction and its linked transaction if it's a transfer
                for (const transaction of transactions) {
                  if (transaction.linkedTransactionId) {
                    // Delete the linked transaction first
                    await db.deleteTransaction(transaction.linkedTransactionId);
                  }
                  // Delete the current transaction
                  await db.deleteTransaction(transaction.id);
                }

                // Delete the account and goal
                await db.deleteAccount(goal.accountId, user?.uid || '');
                await db.deleteGoal(goal.id, user?.uid || '');
                navigation.goBack();
              }
            } catch (error) {
              console.error('Error deleting goal:', error);
              Alert.alert('Error', 'Failed to delete goal');
            }
          },
        },
      ]
    );
  };

  const handleAssignMoney = async () => {
    if (!amount || !selectedAccountId) {
      Alert.alert('Error', 'Please enter amount and select an account');
      return;
    }

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      // Create transfer transaction
      const transactionId = `trans_${Date.now()}`;
      const date = new Date().toISOString();

      // Debit from selected account
      await db.addTransaction({
        id: transactionId,
        userId: user?.uid || '',
        type: 'debit',
        title: `Transfer to ${goal?.title}`,
        categoryId: '',
        amount: transferAmount,
        accountId: selectedAccountId,
        date,
        notes: `Transfer to goal: ${goal?.title}`,
        synced: 0
      });

      // Credit to goal account
      await db.addTransaction({
        id: `trans_${Date.now() + 1}`,
        userId: user?.uid || '',
        type: 'credit',
        title: `Transfer from ${accounts.find(acc => acc.id === selectedAccountId)?.name}`,
        categoryId: '',
        amount: transferAmount,
        accountId: goal?.accountId || '',
        date,
        notes: `Transfer from account: ${accounts.find(acc => acc.id === selectedAccountId)?.name}`,
        linkedTransactionId: transactionId,
        synced: 0
      });

      // Update account balances
      const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);
      if (selectedAccount) {
        await db.updateAccount({
          ...selectedAccount,
          userId: user?.uid || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          synced: 0,
          balance: selectedAccount.balance - transferAmount
        });
      }

      const goalAccount = await db.getAccountById(goal?.accountId || '');
      if (goalAccount) {
        await db.updateAccount({
          ...goalAccount,
          balance: goalAccount.balance + transferAmount
        });
      }

      setShowAssignModal(false);
      setAmount('');
      setSelectedAccountId('');
      loadGoalDetails();
      Alert.alert('Success', 'Money assigned successfully');
    } catch (error) {
      console.error('Error assigning money:', error);
      Alert.alert('Error', 'Failed to assign money');
    }
  };

  const handleMarkAsComplete = async () => {
    if (!goal) return;

    Alert.alert(
      'Mark as Complete',
      'Are you sure you want to mark this goal as complete?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: async () => {
            try {
              await db.updateGoal({
                ...goal,
                status: 'completed'
              });
              loadGoalDetails();
              Alert.alert('Success', 'Goal marked as complete');
            } catch (error) {
              console.error('Error marking goal as complete:', error);
              Alert.alert('Error', 'Failed to mark goal as complete');
            }
          },
        },
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!goal) {
    return (
      <SafeAreaView className={`flex-1 ${isDarkMode ? 'bg-BackgroundDark' : 'bg-Background'}`} edges={['top']}>
        <View className="flex-1 items-center justify-center">
          <Text className={`text-lg ${isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'}`}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDarkMode ? 'bg-BackgroundDark' : 'bg-Background'}`} edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-2"
        >
          <ArrowLeft
            size={24}
            color={isDarkMode ? '#FFFFFF' : '#000000'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleDelete}
          className="p-2"
        >
          <Trash2
            size={24}
            color="#EF4444"
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Goal Icon and Title */}
        <View className="items-center mb-8">
          <View 
            className="w-24 h-24 rounded-[24px] items-center justify-center mb-4"
            style={{ borderColor: '#0ea5e9', borderWidth: 2 }}
          >
            <Text style={fontStyles('extrabold')} className="text-5xl">
              {goal.emoji}
            </Text>
          </View>
          <Text 
            style={fontStyles('extrabold')} 
            className={`text-2xl font-montserrat-bold ${
              isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
            }`}
          >
            {goal.title}
          </Text>
        </View>

        {/* Progress Bar */}
        <View className="mb-8">
          <View className="flex-row justify-between px-5 mb-2">
            <Text 
              style={fontStyles('extrabold')} 
              className={`text-base ${
                isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
              }`}
            >
              Progress
            </Text>
            <Text 
              style={fontStyles('extrabold')} 
              className={`text-base font-medium ${
                isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
              }`}
            >
              {Math.round(progress.percentComplete)}%
            </Text>
          </View>
          <View 
            className={`h-3 w-full rounded-full overflow-hidden ${
              isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
            }`}
          >
            <View 
              className="h-full bg-Primary"
              style={{ width: `${progress.percentComplete}%` }}
            />
          </View>
        </View>

        {/* Goal Details */}
        <View className="px-6 space-y-4">
          <View className={`rounded-[20px] mb-4 p-6 ${
            isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
          }`}>
            <View className="flex-row items-center mb-2">
              <Target size={20} color={isDarkMode ? '#FFFFFF' : '#000000'} className="mr-[5px]" />
              <Text 
                style={fontStyles('extrabold')} 
                className={`text-base ${
                  isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
                }`}
              >
                Target Amount
              </Text>
            </View>
            <Text 
              style={fontStyles('extrabold')} 
              className={`text-2xl ${
                isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
              }`}
            >
              {formatCurrency(goal.targetAmount)}
            </Text>
          </View>

          <View className={`rounded-[20px] mb-4 p-6 ${
            isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
          }`}>
            <View className="flex-row items-center mb-2">
              <Wallet size={20} color={isDarkMode ? '#FFFFFF' : '#000000'} className="mr-2" />
              <Text 
                style={fontStyles('extrabold')} 
                className={`text-base ${
                  isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
                }`}
              >
                Current Amount
              </Text>
            </View>
            <Text 
              style={fontStyles('extrabold')} 
              className={`text-2xl ${
                isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
              }`}
            >
              {formatCurrency(progress.currentAmount)}
            </Text>
          </View>

          <View className={`rounded-[20px] mb-4 p-6 ${
            isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
          }`}>
            <View className="flex-row items-center mb-2">
              <Calendar size={20} color={isDarkMode ? '#FFFFFF' : '#000000'} className="mr-2" />
              <Text 
                style={fontStyles('extrabold')} 
                className={`text-base ${
                  isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
                }`}
              >
                Target Date
              </Text>
            </View>
            <Text 
              style={fontStyles('extrabold')} 
              className={`text-2xl ${
                isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
              }`}
            >
              {formatDate(goal.targetDate)}
            </Text>
            <Text 
              style={fontStyles('extrabold')} 
              className={`text-sm mt-1 ${
                isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
              }`}
            >
              {progress.daysRemaining} days remaining
            </Text>
          </View>

          {/* Monthly Contribution */}
          <View className={`rounded-[20px] mb-4 p-6 ${
            isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
          }`}>
            <Text 
              style={fontStyles('extrabold')} 
              className={`text-base mb-2 ${
                isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
              }`}
            >
              Monthly Contribution Needed
            </Text>
            <Text 
              style={fontStyles('extrabold')} 
              className={`text-2xl ${
                isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
              }`}
            >
              {formatCurrency(goal.monthlyContribution)}
            </Text>
          </View>

        </View>
      </ScrollView>

      {/* Action Buttons */}
      {goal.status === 'active' && (
        <View className="absolute bottom-0 left-0 right-0 p-6 space-y-4">
          <TouchableOpacity
            onPress={() => setShowAssignModal(true)}
            className={`p-4 rounded-[20px] ${
              isDarkMode ? 'bg-PrimaryDark' : 'bg-Primary'
            }`}
          >
            <Text 
              style={fontStyles('extrabold')} 
              className="text-white text-center font-montserrat-semibold text-base"
            >
              Assign Money
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleMarkAsComplete}
            className={`p-4 rounded-[20px] ${
              isDarkMode ? 'bg-green-700' : 'bg-green-500'
            }`}
          >
            <Text 
              style={fontStyles('extrabold')} 
              className="text-white text-center font-montserrat-semibold text-base"
            >
              Mark as Complete
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Assign Money Modal */}
      <Modal
        visible={showAssignModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAssignModal(false)}
      >
        <View className="flex-1 justify-end">
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={() => setShowAssignModal(false)}
            className="absolute inset-0 bg-black/50"
          />
          <View 
            className={`rounded-t-3xl ${
              isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
            }`}
          >
            <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mt-2 mb-4" />
            <View className="p-6 pb-8">
              <Text 
                style={fontStyles('extrabold')} 
                className={`text-2xl font-montserrat-bold mb-6 ${
                  isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                }`}
              >
                Assign Money
              </Text>

              <View className="mb-6">
                <Text 
                  style={fontStyles('extrabold')} 
                  className={`text-base mb-2 ${
                    isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
                  }`}
                >
                  Amount
                </Text>
                <TextInput
                  className={`p-4 rounded-[20px] text-base ${
                    isDarkMode ? 'bg-BackgroundDark text-TextPrimaryDark' : 'bg-white text-TextPrimary'
                  }`}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  placeholder="Enter amount"
                  placeholderTextColor={isDarkMode ? '#B0B0B0' : '#707070'}
                />
              </View>

              <View className="mb-6">
                <Text 
                  style={fontStyles('extrabold')} 
                  className={`text-base mb-2 ${
                    isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
                  }`}
                >
                  From Account
                </Text>
                <TouchableOpacity
                  onPress={() => setShowAccountModal(true)}
                  className={`p-4 rounded-[20px] ${
                    isDarkMode ? 'bg-BackgroundDark' : 'bg-white'
                  }`}
                >
                  {selectedAccountId ? (
                    <View className="flex-row items-center">
                      <Text style={{ fontSize: 24, color: '#000' }}>
                        {accounts.find(acc => acc.id === selectedAccountId)?.icon}
                      </Text>
                      <View>
                        <Text className={`ml-2 text-base ${isDarkMode ? 'text-white' : 'text-black'}`}>
                          {accounts.find(acc => acc.id === selectedAccountId)?.name}
                        </Text>
                        <Text className="ml-2 text-sm text-slate-500">
                          Balance: {formatCurrency(accounts.find(acc => acc.id === selectedAccountId)?.balance || 0)}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <Text className={isDarkMode ? 'text-slate-400' : 'text-slate-500'}>
                      Select account
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              <View className="flex-row justify-between mt-4">
                <TouchableOpacity
                  onPress={() => setShowAssignModal(false)}
                  className={`p-4 rounded-[20px] flex-1 mr-3 ${
                    isDarkMode ? 'bg-BackgroundDark' : 'bg-white'
                  }`}
                >
                  <Text 
                    style={fontStyles('extrabold')} 
                    className={`text-center font-montserrat-semibold text-base ${
                      isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                    }`}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAssignMoney}
                  className={`p-4 rounded-[20px] flex-1 ml-3 ${
                    isDarkMode ? 'bg-PrimaryDark' : 'bg-Primary'
                  }`}
                >
                  <Text 
                    style={fontStyles('extrabold')} 
                    className="text-white text-center font-montserrat-semibold text-base"
                  >
                    Assign
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Account Selection Modal */}
      <Modal
        visible={showAccountModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAccountModal(false)}
      >
        <View className="flex-1 justify-end">
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={() => setShowAccountModal(false)}
            className="absolute inset-0 bg-black/50"
          />
          <View 
            className={`rounded-t-3xl ${
              isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
            }`}
          >
            <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mt-2 mb-4" />
            <View className="p-6 pb-8">
              <Text 
                style={fontStyles('extrabold')} 
                className={`text-2xl font-montserrat-bold mb-6 ${
                  isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                }`}
              >
                Select Account
              </Text>

              <ScrollView className="max-h-[60vh]">
                {accounts.map(account => (
                  <TouchableOpacity
                    key={account.id}
                    onPress={() => {
                      setSelectedAccountId(account.id);
                      setShowAccountModal(false);
                    }}
                    className={`p-4 rounded-[20px] mb-3 ${
                      isDarkMode ? 'bg-BackgroundDark' : 'bg-white'
                    }`}
                  >
                    <View className="flex-row items-center">
                      <Text style={{ fontSize: 24, color: '#000' }}>
                        {account.icon}
                      </Text>
                      <View>
                        <Text className={`ml-2 text-base ${isDarkMode ? 'text-white' : 'text-black'}`}>
                          {account.name}
                        </Text>
                        <Text className="ml-2 text-sm text-slate-500">
                          Balance: {formatCurrency(account.balance)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
} 