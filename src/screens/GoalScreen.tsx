import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import * as db from '../../db/dbUtils';
import { 
  Smile,
  Plus, 
  Trash, 
  Flag,
  Pencil
} from 'lucide-react-native';
import EmojiPicker from 'rn-emoji-keyboard';
import fontStyles from '../utils/fontStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Goal } from '../../db/types';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

interface GoalScreenProps {
  selectedDate: Date;
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
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    emoji: '🎯',
    targetAmount: '',
    targetDate: new Date(),
    monthlyContribution: 0,
  });

  const loadData = useCallback(async () => {
    try {
      // Load goals
      const userGoals = await db.getGoalsByUserId(userId);
      setGoals(userGoals);
    } catch (error) {
      console.error('Error loading goal data:', error);
      Alert.alert('Error', 'Failed to load goal data');
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleEmojiSelect = useCallback((emoji: { emoji: string }) => {
    setFormData(prev => ({ ...prev, emoji: emoji.emoji }));
  }, []);

  const createGoalAccount = async (goalTitle: string): Promise<string> => {
    try {
      const accountId = `acc_${Date.now()}`;
      const accountName = `${goalTitle} Account`;
      
      await db.addAccount({
        id: accountId,
        userId,
        name: accountName,
        balance: 0,
        icon: '💰',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        synced: 0
      });

      return accountId;
    } catch (error) {
      console.error('Error creating goal account:', error);
      throw error;
    }
  };

  const handleAddGoal = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a goal title');
      return;
    }
    if (!formData.emoji.trim()) {
      Alert.alert('Error', 'Please select an emoji');
      return;
    }
    if (!formData.targetAmount.trim()) {
      Alert.alert('Error', 'Please enter a target amount');
      return;
    }

    try {
      const amount = parseFloat(formData.targetAmount);
      if (isNaN(amount) || amount <= 0) {
        Alert.alert('Error', 'Please enter a valid target amount');
        return;
      }

      // Create a new account for the goal
      const accountId = await createGoalAccount(formData.title);

      const id = `goal_${Date.now()}`;
      const newGoal: Goal = {
        id,
        userId,
        title: formData.title,
        emoji: formData.emoji,
        targetAmount: amount,
        targetDate: formData.targetDate.toISOString(),
        accountId,
        includeBalance: false,
        monthlyContribution: formData.monthlyContribution,
        status: 'active',
        createdAt: new Date().toISOString(),
        synced: 0
      };
      
      await db.addGoal(newGoal);
      await loadData();
      closeModal();
    } catch (error) {
      console.error('Error adding goal:', error);
      Alert.alert('Error', 'Failed to add goal');
    }
  };

  const handleEditGoal = async () => {
    if (!editingGoal) return;

    try {
      const amount = parseFloat(formData.targetAmount);
      if (isNaN(amount) || amount <= 0) {
        Alert.alert('Error', 'Please enter a valid target amount');
        return;
      }

      const updatedGoal: Goal = {
        ...editingGoal,
        title: formData.title,
        emoji: formData.emoji,
        targetAmount: amount,
        targetDate: formData.targetDate.toISOString(),
        monthlyContribution: formData.monthlyContribution,
      };
      
      await db.updateGoal(updatedGoal);
      await loadData();
      closeModal();
    } catch (error) {
      console.error('Error updating goal:', error);
      Alert.alert('Error', 'Failed to update goal');
    }
  };

  const handleDeleteGoal = async (id: string) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal? This will also delete the associated account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const goal = goals.find(g => g.id === id);
              if (goal) {
                // Delete the associated account first
                await db.deleteAccount(goal.accountId, userId);
                // Then delete the goal
                await db.deleteGoal(id, userId);
                await loadData();
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

  const resetForm = () => {
    setFormData({
      title: '',
      emoji: '🎯',
      targetAmount: '',
      targetDate: new Date(),
      monthlyContribution: 0,
    });
  };

  const openEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      title: goal.title,
      emoji: goal.emoji,
      targetAmount: goal.targetAmount.toString(),
      targetDate: new Date(goal.targetDate),
      monthlyContribution: goal.monthlyContribution,
    });
    setIsModalVisible(true);
  };

  const openAddModal = () => {
    setEditingGoal(null);
    resetForm();
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setEditingGoal(null);
    resetForm();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderItem = ({ item }: { item: Goal }) => (
    <View className="mb-3">
      <TouchableOpacity
        className={`p-4 rounded-[20px] mb-0 flex-row items-center justify-between ${
          isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
        }`}
        onPress={() => navigation.navigate('GoalDetails', { goalId: item.id })}
      >
        <View className="flex-row items-center flex-1">
          <View 
            className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
            style={{ borderColor: '#0ea5e9', borderWidth: 2 }}
          >
            <Text style={fontStyles('extrabold')} className="text-2xl">{item.emoji}</Text>
          </View>
          <View className="flex-1">
            <Text style={fontStyles('extrabold')} className={`font-montserrat-medium text-lg ${
              isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
            }`}>
              {item.title}
            </Text>
            <Text style={fontStyles('extrabold')} className={`font-montserrat text-sm ${
              isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
            }`}>
              {formatCurrency(item.targetAmount)}
            </Text>
            <Text style={fontStyles('extrabold')} className={`font-montserrat text-sm mt-1 ${
              isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
            }`}>
              Target: {formatDate(new Date(item.targetDate))}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  const EmptyListComponent = () => (
    <View className="flex-1 items-center justify-center">
      <Flag
        size={80}
        color={isDarkMode ? '#666666' : '#999999'}
      />
      <Text style={fontStyles('extrabold')} className={`mt-4 text-lg font-montserrat-medium text-center ${
        isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
      }`}>
        No goals yet
      </Text>
      <Text style={fontStyles('extrabold')} className={`mt-2 text-sm font-montserrat text-center ${
        isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
      }`}>
        Add a goal to get started
      </Text>
    </View>
  );

  return (
    <SafeAreaView className={`flex-1 ${isDarkMode ? 'bg-BackgroundDark' : 'bg-Background'}`} edges={['top']}>
      <View className="px-6 pb-6 flex-1">
        <FlatList
          data={goals}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={EmptyListComponent}
          contentContainerStyle={{ flexGrow: 1 }}
        />
      </View>

      <TouchableOpacity
        onPress={openAddModal}
        className={`rounded-full items-center justify-center ${
          isDarkMode ? 'bg-PrimaryDark' : 'bg-Primary'
        }`}
        style={{ 
          position: 'absolute',
          bottom: 110,
          right: 30,
          width: 56,
          height: 56,
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4
        }}
      >
        <Plus size={30} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Goal Modal */}
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
            style={{ maxHeight: '90%' }}
          >
            <ScrollView 
              showsVerticalScrollIndicator={false}
              className="px-8 py-8"
            >
              <Text style={fontStyles('extrabold')} className={`text-2xl font-montserrat-bold mb-8 ${
                isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
              }`}>
                {editingGoal ? 'Edit Goal' : 'Add New Goal'}
              </Text>

              <View className="flex-row items-center mb-8">
                <View 
                  className="w-20 h-20 rounded-[24px] items-center justify-center mr-6"
                  style={{ borderColor: '#0ea5e9', borderWidth: 2 }}
                >
                  <TextInput
                    className="text-4xl text-center p-0 m-0"
                    value={formData.emoji}
                    placeholder="🎯"
                    placeholderTextColor={isDarkMode ? '#B0B0B0' : '#707070'}
                    editable={false}
                  />
                  <TouchableOpacity 
                    className="absolute bottom-2 right-2 bg-transparent p-4"
                    onPress={() => setIsEmojiPickerVisible(true)}
                  >
                  </TouchableOpacity>
                </View>
                <View className="flex-1">
                  <TextInput
                    className={`p-5 rounded-[24px] text-lg ${
                      isDarkMode ? 'bg-BackgroundDark text-TextPrimaryDark' : 'bg-white text-TextPrimary'
                    }`}
                    placeholder="Goal Title"
                    placeholderTextColor={isDarkMode ? '#B0B0B0' : '#707070'}
                    value={formData.title}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                  />
                </View>
              </View>

              <View className="mb-8">
                <TextInput
                  className={`p-5 rounded-[24px] text-base ${
                    isDarkMode ? 'bg-BackgroundDark text-TextPrimaryDark' : 'bg-white text-TextPrimary'
                  }`}
                  placeholder="Target Amount"
                  placeholderTextColor={isDarkMode ? '#B0B0B0' : '#707070'}
                  value={formData.targetAmount}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, targetAmount: text }))}
                  keyboardType="numeric"
                />
              </View>

              <View className="mb-8">
                <TouchableOpacity
                  className={`p-5 rounded-[24px] ${
                    isDarkMode ? 'bg-BackgroundDark' : 'bg-white'
                  }`}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text className={`text-base ${
                    isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                  }`}>
                    Target Date: {formatDate(formData.targetDate)}
                  </Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={formData.targetDate}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setFormData(prev => ({ ...prev, targetDate: selectedDate }));
                      }
                    }}
                    minimumDate={new Date()}
                  />
                )}
              </View>

              <Text style={fontStyles('extrabold')} className={`font-montserrat-medium mb-4 text-sm ${
                isDarkMode ? 'text-gray-400/50' : 'text-gray-500/50'
              }`}>
                * Add custom emoji for the icon
              </Text>

              <View className="flex-row justify-between mb-6">
                <TouchableOpacity
                  onPress={closeModal}
                  className={`p-5 rounded-[24px] flex-1 mr-3 ${
                    isDarkMode ? 'bg-BackgroundDark' : 'bg-white'
                  }`}
                >
                  <Text style={fontStyles('extrabold')} className={`text-center font-montserrat-semibold text-base ${
                    isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                  }`}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={editingGoal ? handleEditGoal : handleAddGoal}
                  className={`p-5 rounded-[24px] flex-1 ml-3 ${
                    isDarkMode ? 'bg-PrimaryDark' : 'bg-Primary'
                  }`}
                >
                  <Text style={fontStyles('extrabold')} className="text-white text-center font-montserrat-semibold text-base">
                    {editingGoal ? 'Update' : 'Add'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Delete Goal Button */}
              {editingGoal && (
                <TouchableOpacity
                  onPress={() => handleDeleteGoal(editingGoal.id)}
                  className={`p-5 rounded-[24px] mt-6 ${
                    isDarkMode ? 'bg-red-700' : 'bg-red-500'
                  }`}
                >
                  <Text style={fontStyles('extrabold')} className="text-white text-center font-montserrat-semibold text-base">
                    Delete Goal
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      <EmojiPicker
        onEmojiSelected={handleEmojiSelect}
        open={isEmojiPickerVisible}
        onClose={() => setIsEmojiPickerVisible(false)}
      />
    </SafeAreaView>
  );
} 