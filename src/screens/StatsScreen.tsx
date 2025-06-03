import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions, RefreshControl, TouchableOpacity } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, G } from 'react-native-svg';
import { 
  getAllTransactions, 
  getAllCategories,
} from '../../db/dbUtils';
import { Transaction, Category } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import MonthSelector from '../components/BudgetComponents/MonthSelector';
import BarChart from '../components/Charts/BarChart';
import { getRecentTransactionsData, getCategoryBreakdown, ChartDataItem } from '../services/StatisticsService';

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Helper function to get week number in month
const getWeekNumber = (date: Date) => {
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstWeekday = firstDayOfMonth.getDay();
  const offsetDate = date.getDate() + firstWeekday - 1;
  return Math.floor(offsetDate / 7);
};

export default function StatsScreen() {
  const { isDarkMode } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [weeklyData, setWeeklyData] = useState<Array<{
    week: number;
    balance: number;
    transactions: Transaction[];
  }>>([]);
  const [chartData, setChartData] = useState<{
    incomeData: ChartDataItem[];
    expenseData: ChartDataItem[];
    totalIncome: number;
    totalExpense: number;
  }>({
    incomeData: [],
    expenseData: [],
    totalIncome: 0,
    totalExpense: 0
  });

  const loadData = async () => {
    try {
      const transactionsData = await getAllTransactions() as Transaction[];
      setTransactions(transactionsData);

      const categoriesData = await getAllCategories() as Category[];
      setCategories(categoriesData);

      // Get transaction data for charts using the selected month
      const recentStats = await getRecentTransactionsData(selectedDate);
      setChartData(recentStats);

      // Calculate weekly data for selected month
      const selectedMonth = selectedDate.getMonth();
      const selectedYear = selectedDate.getFullYear();
      
      // Get all transactions for the selected month
      const monthlyTransactions = transactionsData.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === selectedMonth && 
               transactionDate.getFullYear() === selectedYear;
      });

      // Group transactions by week
      const weeks = Array.from({ length: 5 }, (_, i) => ({
        week: i,
        balance: 0,
        transactions: [] as Transaction[]
      }));

      monthlyTransactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        const weekNumber = getWeekNumber(transactionDate);
        if (weekNumber >= 0 && weekNumber < 5) {
          weeks[weekNumber].transactions.push(transaction);
          weeks[weekNumber].balance += transaction.type === 'income' ? transaction.amount : -transaction.amount;
        }
      });

      // Calculate cumulative balance
      let runningBalance = 0;
      weeks.forEach(week => {
        runningBalance += week.balance;
        week.balance = runningBalance;
      });

      setWeeklyData(weeks);

    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

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

  // Format month for display
  const getMonthYearDisplay = () => {
    return selectedDate.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  // Navigate to Income Details Screen
  const navigateToIncomeDetails = () => {
    navigation.navigate('IncomeDetails');
  };

  // Navigate to Expense Details Screen
  const navigateToExpenseDetails = () => {
    navigation.navigate('ExpenseDetails');
  };

  const width = Dimensions.get("window").width - 40;
  const height = 200;
  const padding = 40;

  // Calculate chart dimensions
  const chartWidth = width - (padding * 2);
  const chartHeight = height - (padding * 2);

  // Find min and max values for scaling
  const minBalance = Math.min(0, ...weeklyData.map(d => d.balance));
  const maxBalance = Math.max(0, ...weeklyData.map(d => d.balance));
  const valueRange = Math.max(Math.abs(minBalance), Math.abs(maxBalance)) || 1;

  // Create smooth curve path
  const createSmoothPath = () => {
    if (weeklyData.length < 2) return '';
    
    const points = weeklyData.map((data, index) => ({
      x: padding + (index * chartWidth / (weeklyData.length - 1)),
      y: height - padding - ((data.balance + valueRange) * chartHeight / (valueRange * 2))
    }));

    // Create a smooth curve using cubic bezier
    const path = [];
    path.push(`M ${points[0].x} ${points[0].y}`);
    
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const controlPoint1 = {
        x: current.x + (next.x - current.x) / 3,
        y: current.y
      };
      const controlPoint2 = {
        x: current.x + 2 * (next.x - current.x) / 3,
        y: next.y
      };
      path.push(`C ${controlPoint1.x} ${controlPoint1.y}, ${controlPoint2.x} ${controlPoint2.y}, ${next.x} ${next.y}`);
    }
    
    return path.join(' ');
  };

  const linePath = createSmoothPath();

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  return (
    <ScrollView 
      className={`flex-1 ${isDarkMode ? 'bg-BackgroundDark' : 'bg-Background'}`}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#0ea5e9']}
          tintColor={isDarkMode ? '#FFFFFF' : '#000000'}
          progressBackgroundColor={isDarkMode ? '#1E293B' : '#FFFFFF'}
        />
      }
    >
      <View className="p-5 pt-11">
        <View className="mb-5">
          <Text className={`text-2xl font-bold ${isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'}`}>
            Financial Overview
          </Text>
        </View>

        {/* Month Selector */}
        <MonthSelector
          currentDate={selectedDate}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
        />
        <BarChart 
          incomeData={chartData.incomeData} 
          expenseData={chartData.expenseData}
          title={`Income/Expense for ${getMonthYearDisplay()}`}
          formatAmount={formatCurrency} 
        />

        {/* Monthly Summary Card */}
        <View className={`rounded-xl p-4 mb-4 ${isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'}`}>
          <View className="flex-row justify-around mt-2">
            {/* Touchable Income Summary */}
            <TouchableOpacity 
              className="items-center py-2.5 px-5 rounded-lg"
              onPress={navigateToIncomeDetails}
              activeOpacity={0.7}
            >
              <View className="items-center">
                <Text className={`text-sm mb-1 ${isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'}`}>
                  Total Income
                </Text>
                <Text className="text-xl font-bold text-Primary mb-1.5">
                  {formatCurrency(chartData.totalIncome)}
                </Text>
                <View className="mt-1.5">
                  <Text className="text-xs font-medium text-Primary">View Details</Text>
                </View>
              </View>
            </TouchableOpacity>
            
            {/* Touchable Expense Summary */}
            <TouchableOpacity 
              className="items-center py-2.5 px-5 rounded-lg"
              onPress={navigateToExpenseDetails}
              activeOpacity={0.7}
            >
              <View className="items-center">
                <Text className={`text-sm mb-1 ${isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'}`}>
                  Total Expenses
                </Text>
                <Text className="text-xl font-bold text-[#FF3B30] mb-1.5">
                  {formatCurrency(chartData.totalExpense)}
                </Text>
                <View className="mt-1.5">
                  <Text className="text-xs font-medium text-[#FF3B30]">View Details</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 45,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  summaryItem: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  summaryItemInner: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  incomeText: {
    color: '#21965B',
  },
  expenseText: {
    color: '#FF3B30',
  },
  viewDetailsContainer: {
    marginTop: 6,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '500',
  },
});