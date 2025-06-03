import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { PieChart } from 'react-native-gifted-charts';
import { getAllTransactions, getAllCategories } from '../../../db/dbUtils';
import { Transaction, Category } from '../../types';
import { getCategoryBreakdown, CategorySummary } from '../../services/StatisticsService';

// Duration options
const DURATION_OPTIONS = [
  { label: 'This Month', value: 'month' },
  { label: '3 Months', value: '3months' },
  { label: '6 Months', value: '6months' },
  { label: 'This Year', value: 'year' },
];

export default function IncomeScreen() {
  const { isDarkMode } = useTheme();
  const navigation = useNavigation();
  const [selectedDuration, setSelectedDuration] = useState('month');
  const [categoryData, setCategoryData] = useState<CategorySummary[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [pieData, setPieData] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  useEffect(() => {
    loadData();
  }, [selectedDuration]);

  const loadData = async () => {
    try {
      let days = 30; // default for monthly
      const currentDate = new Date();
      
      // Set the days based on selected duration
      switch (selectedDuration) {
        case '3months':
          days = 90;
          break;
        case '6months':
          days = 180;
          break;
        case 'year':
          days = 365;
          break;
        default:
          days = 30;
      }

      // Get category breakdown for income transactions
      const categoryBreakdown = await getCategoryBreakdown('income', 
        selectedDuration === 'month' ? currentDate : undefined, 
        days);
      
      setCategoryData(categoryBreakdown);
      
      // Calculate total income
      const total = categoryBreakdown.reduce((sum, category) => sum + category.amount, 0);
      setTotalIncome(total);
      
      // Format data for pie chart
      const chartData = categoryBreakdown.map(category => ({
        value: category.amount,
        text: Math.round(category.percentage) + '%',
        color: category.categoryColor,
        name: category.categoryName,
        legendFontColor: isDarkMode ? '#FFFFFF' : '#000000',
        legendFontSize: 12,
      }));
      
      setPieData(chartData);
    } catch (error) {
      console.error('Error loading income data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <View className={`flex-1 ${isDarkMode ? 'bg-BackgroundDark' : 'bg-Background'}`}>
      {/* Header */}
      <View className="flex-row justify-between items-center px-5 pt-12 pb-5">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#FFFFFF' : '#000000'} />
        </TouchableOpacity>
        <Text className={`text-xl font-bold ${isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'}`}>
          Income Breakdown
        </Text>
        <View className="w-6" />
      </View>
      
      {/* Duration Selector */}
      <View className="flex-row px-5 mb-5">
        {DURATION_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            className={`py-2 px-3 rounded-full mr-2 ${
              selectedDuration === option.value 
                ? isDarkMode 
                  ? 'bg-PrimaryDark' 
                  : 'bg-[#CBFAE0]'
                : ''
            }`}
            onPress={() => setSelectedDuration(option.value)}
          >
            <Text
              className={`text-xs ${
                selectedDuration === option.value
                  ? isDarkMode
                    ? 'text-white'
                    : 'text-Primary'
                  : isDarkMode
                    ? 'text-TextSecondaryDark'
                    : 'text-TextSecondary'
              }`}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <ScrollView 
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#0ea5e9']} 
            tintColor={isDarkMode ? '#FFFFFF' : '#0ea5e9'}
            title="Pull to refresh"
            titleColor={isDarkMode ? '#FFFFFF' : '#666666'}
          />
        }
      >
        {/* Summary Card */}
        <View className={`mx-5 rounded-xl p-4 mb-4 ${isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'}`}>
          <Text className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'}`}>
            Total Income
          </Text>
          <Text className="text-2xl font-bold text-Primary">
            {formatCurrency(totalIncome)}
          </Text>
        </View>
        
        {/* Pie Chart */}
        {pieData.length > 0 ? (
          <View className={`mx-5 rounded-xl p-4 mb-4 ${isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'}`}>
            <Text className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'}`}>
              Income by Category
            </Text>
            <View className="items-center">
              <PieChart
                donut
                innerRadius={70}
                data={pieData}
                centerLabelComponent={() => (
                  <View className="items-center">
                    <Text className={`text-lg ${isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'}`}>
                      Total
                    </Text>
                    <Text className="text-sm text-Primary">
                      {formatCurrency(totalIncome)}
                    </Text>
                  </View>
                )}
              />
            </View>
            
            {/* Legend */}
            <View className="mt-4">
              {pieData.map((item, index) => (
                <View key={index} className="flex-row items-center mb-2">
                  <View className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }} />
                  <Text className={`text-sm ${isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'}`}>
                    {item.name} ({item.text})
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View className={`mx-5 rounded-xl p-4 mb-4 ${isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'}`}>
            <Text className={`text-center ${isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'}`}>
              No income data for the selected period
            </Text>
          </View>
        )}
        
        {/* Category List */}
        <View className={`mx-5 rounded-xl p-4 mb-4 ${isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'}`}>
          <Text className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'}`}>
            Income Details
          </Text>
          
          {categoryData.map((category, index) => (
            <View key={index} className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ borderColor: category.categoryColor, borderWidth: 2 }}>
                  <Text>{category.categoryIcon}</Text>
                </View>
                <Text className={`text-base ${isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'}`}>
                  {category.categoryName}
                </Text>
              </View>
              <View>
                <Text className="text-base font-semibold text-Primary">
                  {formatCurrency(category.amount)}
                </Text>
                <Text className={`text-xs ${isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'}`}>
                  {Math.round(category.percentage)}% of total
                </Text>
              </View>
            </View>
          ))}
          
          {categoryData.length === 0 && (
            <Text className={`text-center ${isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'}`}>
              No income data to display
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}