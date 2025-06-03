import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart as GiftedBarChart } from 'react-native-gifted-charts';
import { useTheme } from '../../contexts/ThemeContext';
import { ChartDataItem } from '../../services/StatisticsService';

interface BarChartProps {
  incomeData: ChartDataItem[];
  expenseData: ChartDataItem[];
  title?: string;
  height?: number;
  formatAmount?: (amount: number) => string;
}

// Define the bar data item type
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

  // Create data structure for grouped bars
  const barData: BarDataItem[] = [];
  
  // Process each time period's data
  incomeData.forEach((incomeItem, index) => {
    const expenseItem = expenseData[index];
    
    // First bar (income) in group
    barData.push({
      // Income data
      value: incomeItem.value,
      frontColor: incomeItem.frontColor || '#21965B',
      sideColor: incomeItem.sideColor || '#178F50',
      topColor: incomeItem.topColor || '#25AF6A',
      showGradient: true,
      gradientColor: 'rgba(33, 150, 91, 0.4)',
      onPress: () => {},
      // Mark this as the start of a group
      innerBarComponent: (_props: any) => null, // No inner text on bar
      isGroupStart: true,
      spacing: 4,
      // This is for tooltips, not displayed on bars
      label: incomeItem.label,
      dataPointText: 'Income',
      // Only add label component to the first bar of each group
      labelComponent: () => (
        <Text
          style={{
            color: isDarkMode ? '#B0B0B0' : '#666666',
            fontSize: 10,
            marginTop: 6,
            width: 50,
            textAlign: 'center',
          }}
        >
          {incomeItem.label}
        </Text>
      ),
    });
    
    // Second bar (expense) in group
    barData.push({
      // Expense data
      value: expenseItem.value,
      frontColor: expenseItem.frontColor || '#FF3B30',
      sideColor: expenseItem.sideColor || '#E42F24',
      topColor: expenseItem.topColor || '#FF4E44',
      showGradient: true,
      gradientColor: 'rgba(255, 59, 48, 0.4)',
      onPress: () => {},
      // Mark this as the end of a group
      innerBarComponent: (_props: any) => null, // No inner text on bar
      isGroupEnd: true,
      spacing: 26, // Increased spacing after each group
      // This is for tooltips, not displayed on bars
      label: expenseItem.label, 
      dataPointText: 'Expense',
      // Don't add label component to the second bar
      labelComponent: () => null,
    });
  });

  // Calculate max value for Y-axis scale
  const maxValue = Math.max(
    ...incomeData.map(item => item.value),
    ...expenseData.map(item => item.value),
    1000 // Minimum scale for better visualization
  ) * 1.2; // Adding 20% for better visualization

  return (
    <View style={[
      styles.container, 
      { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }
    ]}>
      {title && (
        <Text style={[
          styles.title,
          { color: isDarkMode ? '#FFFFFF' : '#000000' }
        ]}>
          {title}
        </Text>
      )}
      
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#21965B' }]} />
          <Text style={[
            styles.legendText,
            { color: isDarkMode ? '#B0B0B0' : '#666666' }
          ]}>
            Income
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#FF3B30' }]} />
          <Text style={[
            styles.legendText,
            { color: isDarkMode ? '#B0B0B0' : '#666666' }
          ]}>
            Expense
          </Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <GiftedBarChart
          data={barData}
          barWidth={20} // Slightly smaller bars for better spacing
          spacing={10}
          barBorderRadius={4}
          noOfSections={4}
          height={height}
          width={screenWidth - 40} // More space for rendering
          hideRules={true}
          showGradient={true}
          hideYAxisText={false}
          yAxisTextStyle={{
            color: isDarkMode ? '#B0B0B0' : '#666666',
            fontSize: 10,
          }}
          xAxisThickness={1}
          yAxisThickness={1}
          xAxisColor={isDarkMode ? '#444444' : '#DDDDDD'}
          yAxisColor={isDarkMode ? '#444444' : '#DDDDDD'}
          hideOrigin={false}
          maxValue={maxValue}
          // Container styling to prevent clipping  
          xAxisLabelTextStyle={{
            color: isDarkMode ? '#B0B0B0' : '#666666',
            fontSize: 10,
            width: 50,
            textAlign: 'center',
          }}
          renderTooltip={(item: BarDataItem) => {
            return (
              <View style={[
                styles.tooltip,
                { backgroundColor: isDarkMode ? '#2C2C2C' : '#FFFFFF' }
              ]}>
                <Text style={[
                  styles.tooltipText,
                  { color: isDarkMode ? '#FFFFFF' : '#000000' }
                ]}>
                  {item.label} ({item.dataPointText}): {formatAmount(item.value)}
                </Text>
              </View>
            );
          }}
          isAnimated={true}
          // Adjustments to handle grouped bars
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

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
  },
  chartContainer: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 20, // Extra space for labels
    position: 'relative',
  },
  tooltip: {
    padding: 8,
    borderRadius: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  tooltipText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default BarChart;