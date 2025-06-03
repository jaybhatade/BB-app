import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '../../contexts/ThemeContext';
import fontStyles from '../../utils/fontStyles';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const incomeData = [30, 40, 45, 50, 55, 80];
const expenseData = [20, 25, 30, 35, 40, 50];

const incomeLine = incomeData.map((value, idx) => ({ value, label: months[idx] }));
const expenseLine = expenseData.map((value, idx) => ({ value, label: months[idx] }));

const IncomeVsExpenseChart = () => {
  const { isDarkMode } = useTheme();
  const screenWidth = Dimensions.get('window').width;

  return (
    <View className="mx-0 mb-4 mt-2 items-center">
      <Text style={fontStyles('extrabold')} className={`text-2xl ml-4 mb-2 self-start ${isDarkMode ? 'text-white' : 'text-black'}`}>
        Income vs. Expenses
      </Text>
      <Text style={fontStyles('medium')} className={`text-base ml-4  mb-4 self-start ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Monthly Trend
      </Text>
      <LineChart
        data={incomeLine}
        data2={expenseLine}
        width={screenWidth }
        height={200}
        noOfSections={4}
        yAxisThickness={0}
        xAxisThickness={0}
        hideRules
        hideYAxisText
        spacing={screenWidth - 300}
        xAxisLabelTextStyle={{
          color: isDarkMode ? '#fff' : '#000',
          fontSize: 14,
          fontWeight: '500',
        }}
        yAxisColor={isDarkMode ? '#374151' : '#e5e7eb'}
        xAxisColor={isDarkMode ? '#374151' : '#e5e7eb'}
        color1="#3CF2FF"
        color2="#FF5A5F"
        thickness1={3}
        thickness2={3}
        startFillColor1="#3CF2FF"
        endFillColor1="rgba(60,242,255,0.05)"
        startOpacity={0.25}
        endOpacity={0.01}
        startFillColor2="#FF5A5F"
        endFillColor2="rgba(255,90,95,0.05)"
        isAnimated
        animationDuration={700}
        curved
        initialSpacing={20}
        endSpacing={0}
        xAxisLabelTexts={months}
        hideDataPoints
        areaChart
        yAxisTextStyle={{ color: isDarkMode ? '#fff' : '#000', fontSize: 12 }}
        disableScroll
      />
    </View>
  );
};

export default IncomeVsExpenseChart;