import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  TextInput, 
  ScrollView,
  Alert,
  Switch,
  FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import * as db from '../../db/dbUtils';
import NoData from '../components/NoData';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';

interface GoalScreenProps {
  selectedDate: Date;
}

interface Goal {
  id: string;
  title: string;
  emoji: string;
  targetAmount: number;
  targetDate: string;
  accountId: string;
  includeBalance: boolean;
  monthlyContribution: number;
  userId: string;
  createdAt: string;
  synced: number;
  currentAmount?: number;
  progress?: number;
}

interface Account {
  id: string;
  name: string;
  balance: number;
}

export default function GoalScreen({ selectedDate }: GoalScreenProps) {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const userId = user?.uid || '';
  
  const [goals, setGoals] = useState<Goal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState(new Date());
  const [accountId, setAccountId] = useState('');
  const [includeBalance, setIncludeBalance] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [monthlyContribution, setMonthlyContribution] = useState(0);
  
  // Load data when screen is focused
  useEffect(() => {
    loadData();
  }, []);
  
  // Load goals and accounts
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load accounts
      const userAccounts = await db.getAccounts(userId);
      setAccounts(userAccounts);
      
      if (userAccounts.length > 0 && !accountId) {
        setAccountId(userAccounts[0].id);
      }
      
      // Load goals
      const userGoals = await db.getGoalsByUserId(userId);
      
      // Calculate progress for each goal
      const goalsWithProgress = userGoals.map((goal: Goal) => {
        // Get current balance of the account
        const account = userAccounts.find((acc: Account) => acc.id === goal.accountId);
        const currentBalance = account ? account.balance : 0;
        
        // Calculate progress
        const currentAmount = goal.includeBalance ? currentBalance : 0;
        const progress = Math.min((currentAmount / goal.targetAmount) * 100, 100);
        
        return {
          ...goal,
          currentAmount,
          progress
        };
      });
      
      setGoals(goalsWithProgress);
    } catch (error) {
      console.error('Error loading goal data:', error);
      Alert.alert('Error', 'Failed to load goal data');
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate monthly contribution
  const calculateMonthlyContribution = useCallback(() => {
    if (!targetAmount || !accountId) return;
    
    const amount = parseFloat(targetAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    // Get current date and target date
    const now = new Date();
    const target = new Date(targetDate);
    
    // Calculate months remaining
    const monthsRemaining = Math.max(
      (target.getFullYear() - now.getFullYear()) * 12 + 
      (target.getMonth() - now.getMonth()),
      1
    );
    
    // Get account balance if includeBalance is true
    const account = accounts.find(acc => acc.id === accountId);
    const currentBalance = account ? account.balance : 0;
    
    // Calculate monthly contribution
    const startingBalance = includeBalance ? currentBalance : 0;
    const remaining = amount - startingBalance;
    const monthly = Math.ceil(remaining / monthsRemaining);
    
    setMonthlyContribution(monthly);
  }, [targetAmount, targetDate, accountId, includeBalance, accounts]);
  
  // Recalculate when relevant fields change
  useEffect(() => {
    calculateMonthlyContribution();
  }, [calculateMonthlyContribution]);
  
  // Remove the uuid import and use a simple function to generate IDs
  const generateId = () => {
    return 'goal_' + Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  };
  
  // Handle goal save
  const handleSaveGoal = async () => {
    try {
      if (!title || !targetAmount || !accountId) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }
      
      const amount = parseFloat(targetAmount);
      if (isNaN(amount) || amount <= 0) {
        Alert.alert('Error', 'Please enter a valid target amount');
        return;
      }
      
      const now = new Date().toISOString();
      const goalData: Goal = {
        id: editGoal?.id || generateId(),
        title,
        emoji,
        targetAmount: amount,
        targetDate: targetDate.toISOString(),
        accountId,
        includeBalance,
        monthlyContribution,
        userId,
        createdAt: now,
        synced: 0
      };
      
      if (editGoal) {
        // Update existing goal
        await db.updateGoal(goalData);
      } else {
        // Add new goal
        await db.addGoal(goalData);
      }
      
      // Reset form and reload data
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving goal:', error);
      Alert.alert('Error', 'Failed to save goal');
    }
  };
  
  // Handle goal edit
  const handleEditGoal = (goal: Goal) => {
    setEditGoal(goal);
    setTitle(goal.title);
    setEmoji(goal.emoji);
    setTargetAmount(goal.targetAmount.toString());
    setTargetDate(new Date(goal.targetDate));
    setAccountId(goal.accountId);
    setIncludeBalance(goal.includeBalance);
    setShowForm(true);
  };
  
  // Handle goal delete
  const handleDeleteGoal = (id: string) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await db.deleteGoal(id, userId);
              loadData();
            } catch (error) {
              console.error('Error deleting goal:', error);
              Alert.alert('Error', 'Failed to delete goal');
            }
          }
        }
      ]
    );
  };
  
  // Reset form
  const resetForm = () => {
    setEditGoal(null);
    setTitle('');
    setEmoji('🎯');
    setTargetAmount('');
    setTargetDate(new Date());
    setAccountId(accounts.length > 0 ? accounts[0].id : '');
    setIncludeBalance(false);
    setShowForm(false);
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Render goal item
  const renderGoalItem = ({ item }: { item: Goal }) => {
    const account = accounts.find(acc => acc.id === item.accountId);
    
    return (
      <View 
        className={`rounded-xl p-4 mb-4 shadow-sm ${
          isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
        }`}
      >
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center">
            <Text className="text-2xl mr-2">{item.emoji}</Text>
            <Text 
              className={`text-lg font-bold ${
                isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
              }`}
            >
              {item.title}
            </Text>
          </View>
          <View className="flex-row">
            <TouchableOpacity 
              className="p-2 ml-2"
              onPress={() => handleEditGoal(item)}
            >
              <Ionicons 
                name="pencil" 
                size={20} 
                color={isDarkMode ? '#FFFFFF' : '#000000'} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              className="p-2 ml-2"
              onPress={() => handleDeleteGoal(item.id)}
            >
              <Ionicons 
                name="trash" 
                size={20} 
                color="#FF3B30" 
              />
            </TouchableOpacity>
          </View>
        </View>
        
        <View className="mb-4">
          <View className="flex-row justify-between mb-2">
            <Text 
              className={`text-sm ${
                isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
              }`}
            >
              Target:
            </Text>
            <Text 
              className={`text-sm font-medium ${
                isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
              }`}
            >
              {formatCurrency(item.targetAmount)}
            </Text>
          </View>
          
          <View className="flex-row justify-between mb-2">
            <Text 
              className={`text-sm ${
                isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
              }`}
            >
              Current:
            </Text>
            <Text 
              className={`text-sm font-medium ${
                isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
              }`}
            >
              {formatCurrency(item.currentAmount || 0)}
            </Text>
          </View>
          
          <View className="flex-row justify-between mb-2">
            <Text 
              className={`text-sm ${
                isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
              }`}
            >
              Monthly:
            </Text>
            <Text 
              className={`text-sm font-medium ${
                isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
              }`}
            >
              {formatCurrency(item.monthlyContribution)}
            </Text>
          </View>
          
          <View className="flex-row justify-between mb-2">
            <Text 
              className={`text-sm ${
                isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
              }`}
            >
              Account:
            </Text>
            <Text 
              className={`text-sm font-medium ${
                isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
              }`}
            >
              {account?.name || 'Unknown'}
            </Text>
          </View>
          
          <View className="flex-row justify-between mb-2">
            <Text 
              className={`text-sm ${
                isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
              }`}
            >
              Target Date:
            </Text>
            <Text 
              className={`text-sm font-medium ${
                isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
              }`}
            >
              {formatDate(new Date(item.targetDate))}
            </Text>
          </View>
        </View>
        
        <View className="flex-row items-center">
          <View 
            className={`flex-1 h-2 rounded-full overflow-hidden ${
              isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
            }`}
          >
            <View 
              className="h-full bg-Primary"
              style={{ width: `${item.progress || 0}%` }}
            />
          </View>
          <Text 
            className={`ml-2 text-xs font-medium ${
              isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
            }`}
          >
            {Math.round(item.progress || 0)}%
          </Text>
        </View>
      </View>
    );
  };
  
  return (
    <SafeAreaView className="flex-1" edges={['top']}>
      {goals.length > 0 ? (
        <FlatList
          data={goals}
          renderItem={renderGoalItem}
          keyExtractor={(item) => item.id}
          contentContainerClassName="p-5 pb-32"
        />
      ) : (
        <NoData 
          icon="flag-outline"
          message="No goals found. Tap the + button to create a new goal."
        />
      )}
      
      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          resetForm();
          setShowForm(true);
        }}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
      
      {/* Goal Form Modal */}
      <Modal
        visible={showForm}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowForm(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View 
            className={`rounded-t-2xl p-5 max-h-[80%] ${
              isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
            }`}
          >
            <View className="flex-row justify-between items-center mb-5">
              <Text 
                className={`text-xl font-bold ${
                  isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                }`}
              >
                {editGoal ? 'Edit Goal' : 'New Goal'}
              </Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Ionicons 
                  name="close" 
                  size={24} 
                  color={isDarkMode ? '#FFFFFF' : '#000000'} 
                />
              </TouchableOpacity>
            </View>
            
            <ScrollView className="mb-5">
              <View className="mb-4">
                <Text 
                  className={`text-base mb-2 ${
                    isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                  }`}
                >
                  Title
                </Text>
                <TextInput
                  className={`h-[50px] rounded-lg px-4 text-base ${
                    isDarkMode 
                      ? 'bg-slate-700 text-TextPrimaryDark' 
                      : 'bg-slate-100 text-TextPrimary'
                  }`}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Enter goal title"
                  placeholderTextColor={isDarkMode ? '#AAAAAA' : '#999999'}
                />
              </View>
              
              <View className="mb-4">
                <Text 
                  className={`text-base mb-2 ${
                    isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                  }`}
                >
                  Emoji
                </Text>
                <TextInput
                  className={`h-[50px] rounded-lg px-4 text-base ${
                    isDarkMode 
                      ? 'bg-slate-700 text-TextPrimaryDark' 
                      : 'bg-slate-100 text-TextPrimary'
                  }`}
                  value={emoji}
                  onChangeText={setEmoji}
                  placeholder="Enter emoji"
                  placeholderTextColor={isDarkMode ? '#AAAAAA' : '#999999'}
                />
              </View>
              
              <View className="mb-4">
                <Text 
                  className={`text-base mb-2 ${
                    isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                  }`}
                >
                  Target Amount (₹)
                </Text>
                <TextInput
                  className={`h-[50px] rounded-lg px-4 text-base ${
                    isDarkMode 
                      ? 'bg-slate-700 text-TextPrimaryDark' 
                      : 'bg-slate-100 text-TextPrimary'
                  }`}
                  value={targetAmount}
                  onChangeText={setTargetAmount}
                  placeholder="Enter target amount"
                  placeholderTextColor={isDarkMode ? '#AAAAAA' : '#999999'}
                  keyboardType="numeric"
                />
              </View>
              
              <View className="mb-4">
                <Text 
                  className={`text-base mb-2 ${
                    isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                  }`}
                >
                  Target Date
                </Text>
                <TouchableOpacity
                  className={`h-[50px] rounded-lg px-4 justify-center ${
                    isDarkMode ? 'bg-slate-700' : 'bg-slate-100'
                  }`}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text 
                    className={`text-base ${
                      isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                    }`}
                  >
                    {formatDate(targetDate)}
                  </Text>
                </TouchableOpacity>
                
                {showDatePicker && (
                  <DateTimePicker
                    value={targetDate}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setTargetDate(selectedDate);
                      }
                    }}
                    minimumDate={new Date()}
                  />
                )}
              </View>
              
              <View className="mb-4">
                <Text 
                  className={`text-base mb-2 ${
                    isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                  }`}
                >
                  Account
                </Text>
                <View 
                  className={`rounded-lg overflow-hidden ${
                    isDarkMode ? 'bg-slate-700' : 'bg-slate-100'
                  }`}
                >
                  <Picker
                    selectedValue={accountId}
                    onValueChange={(itemValue) => setAccountId(itemValue)}
                    style={{ color: isDarkMode ? '#FFFFFF' : '#000000' }}
                  >
                    {accounts.map((account) => (
                      <Picker.Item 
                        key={account.id} 
                        label={`${account.name} (${formatCurrency(account.balance)})`} 
                        value={account.id} 
                      />
                    ))}
                  </Picker>
                </View>
              </View>
              
              <View className="mb-4">
                <View className="flex-row justify-between items-center mb-2">
                  <Text 
                    className={`text-base ${
                      isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                    }`}
                  >
                    Include Current Balance
                  </Text>
                  <Switch
                    value={includeBalance}
                    onValueChange={setIncludeBalance}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={includeBalance ? '#21965B' : '#f4f3f4'}
                  />
                </View>
                <Text 
                  className={`text-xs ${
                    isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
                  }`}
                >
                  If enabled, your current account balance will be counted towards your goal
                </Text>
              </View>
              
              {monthlyContribution > 0 && (
                <View className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mt-4">
                  <Text 
                    className={`text-base font-medium mb-1 ${
                      isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                    }`}
                  >
                    Monthly Contribution Needed:
                  </Text>
                  <Text className="text-xl font-bold text-Primary">
                    {formatCurrency(monthlyContribution)}
                  </Text>
                </View>
              )}
            </ScrollView>
            
            <View className="flex-row justify-between">
              <TouchableOpacity 
                className="flex-1 h-[50px] rounded-lg justify-center items-center mr-2 bg-slate-100 dark:bg-slate-700"
                onPress={() => setShowForm(false)}
              >
                <Text className="text-base font-medium text-slate-600 dark:text-slate-300">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="flex-1 h-[50px] rounded-lg justify-center items-center ml-2 bg-Primary"
                onPress={handleSaveGoal}
              >
                <Text className="text-base font-medium text-white">
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 110,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
}); 