import { getAllTransactions, getAllCategories } from '../../db/dbUtils';
import { Transaction, Category } from '../types';

// Type definitions for chart data
export interface ChartDataItem {
  value: number;
  label: string;
  frontColor?: string;
  sideColor?: string;
  topColor?: string;
  showGradient?: boolean;
  dataPointText?: string;
  spacing?: number;
}

export interface CategorySummary {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  amount: number;
  percentage: number;
}

/**
 * Get the week number of the month for a given date
 * This follows the common definition where the first week contains the 1st day of the month
 * 
 * @param date The date to get the week number for
 * @returns Week number (1-5)
 */
const getWeekOfMonth = (date: Date): number => {
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  
  // Calculate days passed since beginning of the month
  const daysPassed = Math.floor((date.getTime() - firstDayOfMonth.getTime()) / (1000 * 60 * 60 * 24));
  
  // Get the day of week of the first day (0 = Sunday, 6 = Saturday)
  const firstDayOfWeek = firstDayOfMonth.getDay();
  
  // Calculate the week number (1-based)
  return Math.ceil((daysPassed + firstDayOfWeek) / 7);
};

/**
 * Format labels based on the time span
 */
const formatWeekLabels = (weekNum: number, monthView: boolean): string => {
  if (monthView) {
    // For monthly view, we'll use "Week 1", "Week 2", etc.
    return `Week ${weekNum}`;
  } else {
    // For 30-day view, we'll use "W1", "W2", etc.
    return `W${weekNum}`;
  }
};

// Get transactions for the last 30 days or for a specific month
export const getRecentTransactionsData = async (
  selectedDate?: Date,
  days = 30
): Promise<{
  incomeData: ChartDataItem[];
  expenseData: ChartDataItem[];
  totalIncome: number;
  totalExpense: number;
}> => {
  try {
    const transactions = await getAllTransactions() as Transaction[];
    const categories = await getAllCategories() as Category[];
    
    // Create a map of categories for quick lookup
    const categoryMap = categories.reduce<Record<string, Category>>((acc, category) => {
      acc[category.id] = category;
      return acc;
    }, {});
    
    let recentTransactions: Transaction[];
    let isMonthView = false;
    
    if (selectedDate) {
      // Filter transactions for the selected month
      isMonthView = true;
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      
      recentTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate.getFullYear() === year && 
               transactionDate.getMonth() === month;
      });
    } else {
      // Default: last 30 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      recentTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      });
    }
    
    if (isMonthView) {
      // For month view, we'll organize by actual calendar weeks
      // Initialize weekly data structure with up to 6 weeks (some months may span 6 weeks)
      const weeklyData: { [weekNumber: number]: { incomeAmount: number, expenseAmount: number } } = {};
      
      // First, get the month and year we're analyzing
      const year = selectedDate!.getFullYear();
      const month = selectedDate!.getMonth();
      
      // Process transactions by calendar week
      recentTransactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        // Get the week of the month (1-5, sometimes 6)
        const weekOfMonth = getWeekOfMonth(transactionDate);
        
        // Initialize the week data if it doesn't exist
        if (!weeklyData[weekOfMonth]) {
          weeklyData[weekOfMonth] = { incomeAmount: 0, expenseAmount: 0 };
        }
        
        // Add transaction amounts to respective week
        if (transaction.type === 'income') {
          weeklyData[weekOfMonth].incomeAmount += transaction.amount;
        } else if (transaction.type === 'expense') {
          weeklyData[weekOfMonth].expenseAmount += transaction.amount;
        }
      });
      
      // Convert the weeklyData object to ordered arrays for charts
      const weekNumbers = Object.keys(weeklyData).map(Number).sort((a, b) => a - b);
      
      const incomeData: ChartDataItem[] = weekNumbers.map(weekNum => ({
        value: weeklyData[weekNum].incomeAmount,
        label: formatWeekLabels(weekNum, isMonthView),
        frontColor: '#21965B',
        sideColor: '#178F50',
        topColor: '#25AF6A',
        showGradient: true,
        dataPointText: 'Income',
      }));
      
      const expenseData: ChartDataItem[] = weekNumbers.map(weekNum => ({
        value: weeklyData[weekNum].expenseAmount,
        label: formatWeekLabels(weekNum, isMonthView),
        frontColor: '#FF3B30',
        sideColor: '#E42F24',
        topColor: '#FF4E44',
        showGradient: true,
        dataPointText: 'Expense',
      }));
      
      // Calculate totals
      const totalIncome = Object.values(weeklyData).reduce((sum, data) => sum + data.incomeAmount, 0);
      const totalExpense = Object.values(weeklyData).reduce((sum, data) => sum + data.expenseAmount, 0);
      
      return {
        incomeData,
        expenseData,
        totalIncome,
        totalExpense
      };
    } else {
      // For 30-day view, divide into 4 equal periods as before
      const weeklyData = Array.from({ length: 4 }, (_, i) => ({
        week: i + 1, // Make 1-based for consistency with month view
        incomeAmount: 0,
        expenseAmount: 0,
      }));
      
      const endDate = new Date();
      const daysPerSection = days / weeklyData.length;
      
      recentTransactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date);
        const dayDiff = Math.floor((endDate.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
        const sectionIndex = Math.min(Math.floor(dayDiff / daysPerSection), weeklyData.length - 1);
        
        if (transaction.type === 'income') {
          weeklyData[sectionIndex].incomeAmount += transaction.amount;
        } else if (transaction.type === 'expense') {
          weeklyData[sectionIndex].expenseAmount += transaction.amount;
        }
      });
      
      // Format data for bar chart
      const incomeData: ChartDataItem[] = weeklyData.map(data => ({
        value: data.incomeAmount,
        label: formatWeekLabels(data.week, isMonthView),
        frontColor: '#21965B',
        sideColor: '#178F50',
        topColor: '#25AF6A',
        showGradient: true,
        dataPointText: 'Income',
      }));
      
      const expenseData: ChartDataItem[] = weeklyData.map(data => ({
        value: data.expenseAmount,
        label: formatWeekLabels(data.week, isMonthView),
        frontColor: '#FF3B30',
        sideColor: '#E42F24',
        topColor: '#FF4E44',
        showGradient: true,
        dataPointText: 'Expense',
      }));
      
      // Calculate totals
      const totalIncome = weeklyData.reduce((sum, data) => sum + data.incomeAmount, 0);
      const totalExpense = weeklyData.reduce((sum, data) => sum + data.expenseAmount, 0);
      
      return {
        incomeData,
        expenseData,
        totalIncome,
        totalExpense
      };
    }
  } catch (error) {
    console.error('Error processing statistics data:', error);
    return {
      incomeData: [],
      expenseData: [],
      totalIncome: 0,
      totalExpense: 0
    };
  }
};

// Get category breakdown for expenses or income
export const getCategoryBreakdown = async (
  type: 'expense' | 'income',
  selectedDate?: Date,
  days = 30
): Promise<CategorySummary[]> => {
  try {
    const transactions = await getAllTransactions() as Transaction[];
    const categories = await getAllCategories() as Category[];
    
    // Create a map of categories for quick lookup
    const categoryMap = categories.reduce<Record<string, Category>>((acc, category) => {
      acc[category.id] = category;
      return acc;
    }, {});
    
    let filteredTransactions: Transaction[];
    
    if (selectedDate) {
      // Filter transactions for the selected month
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      
      filteredTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transaction.type === type && 
               transactionDate.getFullYear() === year && 
               transactionDate.getMonth() === month;
      });
    } else {
      // Filter for last 30 days by default
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      filteredTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transaction.type === type && 
               transactionDate >= startDate && 
               transactionDate <= endDate;
      });
    }
    
    // Group transactions by category
    const categoryAmounts: Record<string, number> = {};
    
    filteredTransactions.forEach(transaction => {
      if (!categoryAmounts[transaction.categoryId]) {
        categoryAmounts[transaction.categoryId] = 0;
      }
      categoryAmounts[transaction.categoryId] += transaction.amount;
    });
    
    // Calculate total amount
    const totalAmount = Object.values(categoryAmounts).reduce((sum, amount) => sum + amount, 0);
    
    // Format data for category breakdown
    const categoryBreakdown: CategorySummary[] = Object.entries(categoryAmounts)
      .map(([categoryId, amount]) => {
        const category = categoryMap[categoryId];
        return {
          categoryId,
          categoryName: category?.name || 'Unknown',
          categoryIcon: category?.icon || '💰',
          categoryColor: category?.color || '#666666',
          amount,
          percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0
        };
      })
      .sort((a, b) => b.amount - a.amount);
    
    return categoryBreakdown;
  } catch (error) {
    console.error('Error processing category breakdown:', error);
    return [];
  }
};