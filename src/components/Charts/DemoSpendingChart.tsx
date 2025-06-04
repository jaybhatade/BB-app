import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Dimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { useTheme } from '../../contexts/ThemeContext';
import fontStyles from '../../utils/fontStyles';
import { useAuth } from '../../contexts/AuthContext';
import * as transactionManagement from '../../../db/transaction-management';
import * as categoryManagement from '../../../db/category-management';
import { useFocusEffect } from '@react-navigation/native';

interface ChartData {
  value: number;
  label: string;
  frontColor: string;
}

const DemoSpendingChart = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const screenWidth = Dimensions.get('window').width;
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const fetchSpendingData = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      // Get current month's start and end dates
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

      // Get category totals for the current month
      const categoryTotals = await transactionManagement.getCategoryTotals(
        startDate,
        endDate,
        user.uid
      );

      // Get all categories to map IDs to names and colors
      const categories = await categoryManagement.getCategories(user.uid);
      const categoryMap = new Map(categories.map(cat => [cat.id, cat]));

      // Transform data for the chart
      const transformedData = categoryTotals
        .filter(total => {
          const category = categoryMap.get(total.categoryId);
          return total.total > 0 && category?.type === 'expense'; // Only show expense categories with transactions
        })
        .map(total => {
          const category = categoryMap.get(total.categoryId);
          return {
            value: Math.abs(total.total), // Use absolute value for display
            label: category?.name || 'Unknown',
            frontColor: category?.color || '#F7B0B7',
          };
        })
        .sort((a, b) => b.value - a.value) // Sort by value descending
        .slice(0, 3); // Show top 3 categories

      setChartData(transformedData);
    } catch (error) {
      console.error('Error fetching spending data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSpendingData();
  }, [fetchSpendingData, lastUpdate]);

  useFocusEffect(
    useCallback(() => {
      fetchSpendingData();
      return () => {};
    }, [fetchSpendingData])
  );

  if (isLoading) {
    return (
      <View className={`mx-4 mb-4 mt-2 items-center`}>
        <Text style={fontStyles('extrabold')} className={`text-2xl mb-2 self-start ${isDarkMode ? 'text-white' : 'text-black'}`}>
          Expense Breakdown
        </Text>
        <Text style={fontStyles('medium')} className={`text-base mb-4 self-start ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Loading...
        </Text>
      </View>
    );
  }

  if (chartData.length === 0) {
    return (
      <View className={`mx-4 mb-4 mt-2 items-center`}>
        <Text style={fontStyles('extrabold')} className={`text-2xl mb-2 self-start ${isDarkMode ? 'text-white' : 'text-black'}`}>
          Expense Breakdown
        </Text>
        <Text style={fontStyles('medium')} className={`text-base mb-4 self-start ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          No expense data available for this month
        </Text>
      </View>
    );
  }

  return (
    <View className={`mx-4 mb-4 mt-2 items-center`}>
      <Text style={fontStyles('extrabold')} className={`text-2xl mb-2 self-start ${isDarkMode ? 'text-white' : 'text-black'}`}>
        Expense Breakdown
      </Text>
      <Text style={fontStyles('medium')} className={`text-base mb-4 self-start ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Top 3 Expense Categories
      </Text>
      <BarChart
        data={chartData}
        barWidth={(screenWidth - 60) / chartData.length - 20}
        spacing={30}
        height={200}
        width={screenWidth - 32}
        noOfSections={4}
        yAxisThickness={0}
        xAxisThickness={0}
        hideRules
        hideYAxisText
        xAxisLabelTextStyle={{
          color: isDarkMode ? '#fff' : '#000',
          fontSize: 14,
          fontWeight: '500',
        }}
        yAxisColor={isDarkMode ? '#374151' : '#e5e7eb'}
        xAxisColor={isDarkMode ? '#374151' : '#e5e7eb'}
        barBorderRadius={8}
        isAnimated
        animationDuration={600}
        disableScroll
        initialSpacing={0}
        endSpacing={0}
      />
    </View>
  );
};

export default DemoSpendingChart;