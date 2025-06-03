import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  Alert,
  StyleSheet
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as db from '../../db/dbUtils';
import BudgetSummary from '../components/BudgetComponents/BudgetSummary';
import BudgetItem from '../components/BudgetComponents/BudgetItem';
import BudgetForm from '../components/BudgetComponents/BudgetForm';
import MonthSelector from '../components/BudgetComponents/MonthSelector';
import NoData from '../components/NoData';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import GoalScreen from './GoalScreen';
import { SafeAreaView } from 'react-native-safe-area-context';
import BudgetPieChart from '../components/BudgetComponents/BudgetPieChart';
import BudgetListCards from '../components/BudgetComponents/BudgetListCards';

export default function BudgetScreen() {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const userId = user?.uid || '';
  const [budgets, setBudgets] = useState<any[]>([]);
  const [filteredBudgets, setFilteredBudgets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editBudget, setEditBudget] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'budget' | 'goal'>('budget');
  const [selectedMonth, setSelectedMonth] = useState<number>(selectedDate.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(selectedDate.getFullYear());
  
  // Summary calculations for filtered budgets
  const totalBudget = filteredBudgets.reduce((sum, budget) => sum + budget.budgetLimit, 0);
  const totalSpent = filteredBudgets.reduce((sum, budget) => sum + budget.spent, 0);
  const totalRemaining = totalBudget - totalSpent;

  // Load data when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadData();
      return () => {}; // Cleanup function
    }, [])
  );

  // Filter budgets when selected date changes
  useEffect(() => {
    filterBudgetsByMonth();
  }, [selectedDate, budgets]);

  // Filter budgets by the selected month
  const filterBudgetsByMonth = () => {
    const selectedMonth = selectedDate.getMonth();
    const selectedYear = selectedDate.getFullYear();
    
    const filtered = budgets.filter(budget => 
      budget.month === selectedMonth && budget.year === selectedYear
    );
    
    setFilteredBudgets(filtered);
  };

  // Load budgets and categories
  const loadData = async () => {
    try {
      setLoading(true);
      // Load categories first since we need them for budget display
      const allCategories = await db.getAllCategories();
      setCategories(allCategories);
      
      // Then load budgets with spending data
      const budgetsWithSpending = await db.getBudgetsWithSpending(userId);
      setBudgets(budgetsWithSpending);
    } catch (error) {
      console.error('Error loading budget data:', error);
      Alert.alert('Error', 'Failed to load budget data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Find category details by ID
  const getCategoryById = (categoryId: string) => {
    return categories.find(category => category.id === categoryId);
  };

  // Handle budget save (add or update)
  const handleSaveBudget = async (budget: any) => {
    try {
      if (editBudget) {
        // Update existing budget
        await db.updateBudget(budget);
      } else {
        // Add new budget
        await db.addBudget(budget);
      }
      
      // Reset edit state and reload data
      setEditBudget(null);
      loadData();
    } catch (error) {
      console.error('Error saving budget:', error);
      Alert.alert('Error', 'Failed to save budget');
    }
  };

  // Handle budget edit
  const handleEditBudget = (id: string) => {
    const budgetToEdit = budgets.find(budget => budget.id === id);
    if (budgetToEdit) {
      setEditBudget(budgetToEdit);
      setShowForm(true);
    }
  };

  // Handle budget delete
  const handleDeleteBudget = (budget: any) => {
    Alert.alert(
      'Delete Budget',
      'Are you sure you want to delete this budget?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await db.deleteBudget(budget.id, userId);
              loadData();
            } catch (error) {
              console.error('Error deleting budget:', error);
              Alert.alert('Error', 'Failed to delete budget');
            }
          }
        }
      ]
    );
  };

  // Handle month navigation
  const handlePreviousMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setSelectedDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setSelectedDate(newDate);
  };

  // Render the budget content
  const renderBudgetContent = () => {
    return (
      <>
        {/* Month Selector */}
        <MonthSelector
          currentDate={selectedDate}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
        />
        {filteredBudgets.length > 0 ? (
          <>
            <BudgetPieChart 
              isDarkMode={isDarkMode}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
            />
            <BudgetListCards
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
            />
          </>
        ) : (
          <NoData 
            icon="wallet-outline"
            message="No budgets found for this month. Tap the + button to create a new budget."
          />
        )}
      </>
    );
  };

  return (
    <SafeAreaView className={`flex-1 ${isDarkMode ? 'bg-BackgroundDark' : 'bg-Background'}`} edges={['top']}>
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-4">
        <Text className={`text-2xl font-bold ${isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'}`}>
          Budget & Goals
        </Text>
      </View>

      {/* Tabs */}
      <View className="flex-row border-b border-slate-200 dark:border-slate-700 mb-4">
        <TouchableOpacity 
          className={`flex-1 py-3 items-center ${activeTab === 'budget' ? 'border-b-2 border-Primary' : ''}`}
          onPress={() => setActiveTab('budget')}
        >
          <Text 
            className={`text-base font-medium ${activeTab === 'budget' ? 'font-bold' : ''} ${
              isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
            }`}
          >
            Budget
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className={`flex-1 py-3 items-center ${activeTab === 'goal' ? 'border-b-2 border-Primary' : ''}`}
          onPress={() => setActiveTab('goal')}
        >
          <Text 
            className={`text-base font-medium ${activeTab === 'goal' ? 'font-bold' : ''} ${
              isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
            }`}
          >
            Goals
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'budget' ? (
        <ScrollView
          className="flex-1"
          contentContainerClassName="p-4 pb-32"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {renderBudgetContent()}
        </ScrollView>
      ) : (
        <View className="flex-1">
          <GoalScreen selectedDate={selectedDate} />
        </View>
      )}

      {/* Floating Action Button */}
      {activeTab === 'budget' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            setEditBudget(null);
            setShowForm(true);
          }}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Budget Form Modal */}
      <BudgetForm
        visible={showForm}
        onClose={() => setShowForm(false)}
        onSave={handleSaveBudget}
        onDelete={handleDeleteBudget}
        editBudget={editBudget}
      />
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