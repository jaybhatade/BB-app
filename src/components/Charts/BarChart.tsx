import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { BarChart as GiftedBarChart } from 'react-native-gifted-charts';
import { useTheme } from '../../contexts/ThemeContext';
import { ChartDataItem } from '../../services/StatisticsService';
import fontStyles from '../../utils/fontStyles';

interface BarChartProps {
  incomeData: ChartDataItem[];
  expenseData: ChartDataItem[];
  title?: string;
  height?: number;
  formatAmount?: (amount: number) => string;
}

interface BarDataItem {
  value: number;
  frontColor: string;
  sideColor: string;
  topColor: string;
  showGradient: boolean;
  gradientColor: string;
  onPress: () => void;
  innerBarComponent?: (props: any) => null;
  isGroupStart?: boolean;
  isGroupEnd?: boolean;
  spacing: number;
  label: string;
  dataPointText: string;
  labelComponent?: () => React.ReactNode;
}

const BarChart = ({
  incomeData,
  expenseData,
  title = 'Monthly Overview',
  height = 220,
  formatAmount = (amount) => amount.toLocaleString('en-IN'),
}: BarChartProps) => {
  const { isDarkMode } = useTheme();
  const screenWidth = Dimensions.get('window').width;

  const barData: BarDataItem[] = [];
  
  incomeData.forEach((incomeItem, index) => {
    const expenseItem = expenseData[index];
    
    barData.push({
      value: incomeItem.value,
      frontColor: incomeItem.frontColor || '#21965B',
      sideColor: incomeItem.sideColor || '#178F50',
      topColor: incomeItem.topColor || '#25AF6A',
      showGradient: true,
      gradientColor: 'rgba(33, 150, 91, 0.4)',
      onPress: () => {},
      innerBarComponent: (_props: any) => null,
      isGroupStart: true,
      spacing: 4,
      label: incomeItem.label,
      dataPointText: 'Income',
      labelComponent: () => (
        <Text className={`text-[10px] mt-1.5 w-[50px] text-center ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          {incomeItem.label}
        </Text>
      ),
    });
    
    barData.push({
      value: expenseItem.value,
      frontColor: expenseItem.frontColor || '#FF3B30',
      sideColor: expenseItem.sideColor || '#E42F24',
      topColor: expenseItem.topColor || '#FF4E44',
      showGradient: true,
      gradientColor: 'rgba(255, 59, 48, 0.4)',
      onPress: () => {},
      innerBarComponent: (_props: any) => null,
      isGroupEnd: true,
      spacing: 26,
      label: expenseItem.label,
      dataPointText: 'Expense',
      labelComponent: () => null,
    });
  });

  const maxValue = Math.max(
    ...incomeData.map(item => item.value),
    ...expenseData.map(item => item.value),
    1000
  ) * 1.2;

  return (
    <View className={`rounded-xl p-4 mb-4 ${isDarkMode ? 'bg-slate-900' : 'bg-white'} shadow-sm`}>
      {title && (
        <Text className={`text-lg mb-3 ${isDarkMode ? 'text-white' : 'text-black'} ${fontStyles('semibold')}`}>
          {title}
        </Text>
      )}
      
      <View className="flex-row justify-center mb-4">
        <View className="flex-row items-center mx-2.5">
          <View className="w-3 h-3 rounded-full mr-1 bg-[#21965B]" />
          <Text className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Income
          </Text>
        </View>
        <View className="flex-row items-center mx-2.5">
          <View className="w-3 h-3 rounded-full mr-1 bg-[#FF3B30]" />
          <Text className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Expense
          </Text>
        </View>
      </View>

      <View className="w-full items-center pb-5 relative">
        <GiftedBarChart
          data={barData}
          barWidth={20}
          spacing={10}
          barBorderRadius={4}
          noOfSections={4}
          height={height}
          width={screenWidth - 40}
          hideRules={true}
          showGradient={true}
          hideYAxisText={false}
          yAxisTextStyle={{
            color: isDarkMode ? '#94a3b8' : '#475569',
            fontSize: 10,
          }}
          xAxisThickness={1}
          yAxisThickness={1}
          xAxisColor={isDarkMode ? '#334155' : '#e2e8f0'}
          yAxisColor={isDarkMode ? '#334155' : '#e2e8f0'}
          hideOrigin={false}
          maxValue={maxValue}
          xAxisLabelTextStyle={{
            color: isDarkMode ? '#94a3b8' : '#475569',
            fontSize: 10,
            width: 50,
            textAlign: 'center',
          }}
          renderTooltip={(item: BarDataItem) => (
            <View className={`p-2 rounded shadow-sm ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
              <Text className={`text-xs ${isDarkMode ? 'text-white' : 'text-black'} ${fontStyles('medium')}`}>
                {item.label} ({item.dataPointText}): {formatAmount(item.value)}
              </Text>
            </View>
          )}
          isAnimated={true}
          disableScroll={true}
          animationDuration={500}
          yAxisLabelTexts={[
            '0',
            formatAmount(maxValue * 0.25),
            formatAmount(maxValue * 0.5),
            formatAmount(maxValue * 0.75),
            formatAmount(maxValue),
          ]}
        />
      </View>
    </View>
  );
};

export default BarChart;