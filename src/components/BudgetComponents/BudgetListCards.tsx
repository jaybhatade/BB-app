import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import * as db from '../../../db/dbUtils';
import NoData from '../NoData';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronRight } from 'lucide-react-native';

// Budget and Category interfaces to match db types
interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  budgetLimit: number;
  month: number;
  year: number;
  createdAt: string;
  spent: number;
  percentUsed: number;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: string;
}

// Modified BudgetProgressBar component to match the UI in the image
const BudgetProgressBar = ({ 
  percentUsed, 
  spent, 
  budgetLimit
}: { 
  percentUsed: number; 
  spent: number; 
  budgetLimit: number;
}) => {
  const remaining = budgetLimit - spent;
  const isExceeded = spent > budgetLimit;
  const displayPercent = Math.min(percentUsed, 100);
  
  // Determine progress bar color based on percentage used
  const getProgressColor = (percent: number) => {
    if (isExceeded) return '#FF3B30'; // Red for exceeded
    if (percent >= 90) return '#FF3B30'; // Red
    if (percent >= 70) return '#FFCC00'; // Yellow
    return '#4ADE80'; // Green
  };

  // Get status text based on budget condition
  const getStatusText = () => {
    if (isExceeded) return 'Budget Exceeded';
    if (percentUsed >= 90) return 'Almost Exceeded';
    if (percentUsed >= 70) return 'Warning';
    return 'Good';
  };

  // Get status color
  const getStatusColor = () => {
    if (isExceeded) return '#FF3B30';
    if (percentUsed >= 90) return '#FF3B30';
    if (percentUsed >= 70) return '#FFCC00';
    return '#4ADE80';
  };

  return (
    <View className="mt-2">
      <View className="h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
        <View 
          className="h-full rounded-full"
          style={{ 
            width: `${displayPercent}%`,
            backgroundColor: getProgressColor(percentUsed),
          }} 
        />
      </View>
      
      <View className="flex-row-reverse justify-between items-center mt-1">
        <View className="flex-row items-baseline">
          <Text className={`text-xl font-bold ${isExceeded ? 'text-red-500' : 'text-white'}`}>
            Left:  ₹{Math.abs(remaining).toLocaleString()}
          </Text>
          <Text className="text-sm text-gray-400 ml-1">/₹{budgetLimit.toLocaleString()}</Text>
        </View>
        <Text className={`text-md font-semibold`} style={{ color: getStatusColor() }}>
          {getStatusText()}
        </Text>
      </View>
    </View>
  );
};

interface BudgetListCardsProps {
  selectedMonth: number;
  selectedYear: number;
}

const BudgetListCards: React.FC<BudgetListCardsProps> = ({ selectedMonth, selectedYear }) => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const userId = user?.uid || '';
  const navigation = useNavigation();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSingleItem, setIsSingleItem] = useState<boolean>(false);
  const screenWidth = Dimensions.get('window').width;

  // Load data when component mounts or regains focus
  useFocusEffect(
    useCallback(() => {
      loadData();
      return () => {}; // Cleanup function
    }, [selectedMonth, selectedYear])
  );

  // Load budgets and categories
  const loadData = async () => {
    try {
      setLoading(true);
      // Load categories first since we need them for budget display
      const allCategories = await db.getAllCategories();
      setCategories(allCategories);

      // Then load budgets with spending data
      const budgetsWithSpending = await db.getBudgetsWithSpending(userId);
      
      // Filter for selected month only
      const selectedMonthBudgets = budgetsWithSpending.filter(budget => 
        budget.month === selectedMonth && budget.year === selectedYear
      );
      
      // Set state for single item check
      setIsSingleItem(selectedMonthBudgets.length === 1);
      setBudgets(selectedMonthBudgets);
    } catch (error) {
      console.error('Error loading budget data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Find category details by ID
  const getCategoryById = (categoryId: string) => {
    return categories.find(category => category.id === categoryId);
  };

  // Navigate to budget screen
  const navigateToBudgetScreen = () => {
    // Navigate to the Budget tab in the MainTabs navigator
    navigation.navigate('MainTabs', { screen: 'Budget' });
  };

  // Render individual budget card
  const renderBudgetCard = ({ item }: { item: Budget }) => {
    const category = getCategoryById(item.categoryId);

    if (!category) return null;

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('BudgetCategoryDetails', { budget: item, category })}
        className={`rounded-[20px] p-4 mb-3 bg-slate-800  ${isSingleItem ? 'w-full' : 'w-full'}`}
      >
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-2xl font-bold text-white">
            {category.name}
          </Text>
        </View>
        
        <BudgetProgressBar 
          percentUsed={item.percentUsed} 
          spent={item.spent} 
          budgetLimit={item.budgetLimit} 
        />
      </TouchableOpacity>
    );
  };

  // If loading or no data
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className={`text-center ${isDarkMode ? 'text-white' : 'text-black'}`}>
          Loading budgets...
        </Text>
      </View>
    );
  }

  if (budgets.length === 0) {
    return <NoData message="No budgets found" />;
  }

  return (
    <View className="flex-1 w-full px-[10px] mt-5">
      {isSingleItem ? (
        <View className="items-center w-full">
          {renderBudgetCard({ item: budgets[0] })}
        </View>
      ) : (
        <FlatList
          data={budgets}
          renderItem={renderBudgetCard}
          keyExtractor={(item) => item.id}
          horizontal={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ width: '100%' }}
        />
      )}
    </View>
  );
};

export default BudgetListCards;