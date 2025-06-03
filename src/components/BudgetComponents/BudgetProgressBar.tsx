import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface BudgetProgressBarProps {
  percentUsed: number;
  spent: number;
  budgetLimit: number;
  categoryColor?: string; // Add optional category color prop
}

const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({ 
  percentUsed, 
  spent, 
  budgetLimit,
  categoryColor = '#21965B' // Default color if not provided
}) => {
  const { isDarkMode } = useTheme();
  
  // Cap the percent at 100% for UI display
  const cappedPercent = percentUsed > 100 ? 100 : percentUsed;
  
  // Calculate amount left or exceeded
  const amountDifference = budgetLimit - spent;
  const isExceeded = amountDifference < 0;
  
  // Determine color based on usage percentage
  const getProgressColor = () => {
    // Use category color if provided, otherwise use default color scheme
    if (categoryColor) return categoryColor;
    
    if (percentUsed < 50) return '#21965B'; // Green - good
    if (percentUsed < 80) return '#FFB347'; // Orange - warning
    return '#FF6B6B'; // Red - critical
  };

  // Determine text color for amount left/exceeded
  const getAmountColor = () => {
    if (percentUsed < 50) return '#21965B'; // Green - good
    if (percentUsed < 80) return '#FFB347'; // Orange - warning
    return '#FF6B6B'; // Red - critical
  };

  return (
    <View style={styles.container}>
      <View style={[
        styles.progressBackground,
        { backgroundColor: isDarkMode ? '#333333' : '#E0E0E0' }
      ]}>
        <View 
          style={[
            styles.progressFill,
            { 
              width: `${cappedPercent}%`,
              backgroundColor: getProgressColor()
            }
          ]} 
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={[
          styles.text,
          { color: isDarkMode ? '#FFFFFF' : '#000000' }
        ]}>
          ₹ {spent } of ₹ {budgetLimit }
        </Text>
        <Text style={[
          styles.text,
          { 
            color: isDarkMode ? '#FFFFFF' : '#000000' 
          }
        ]}>

          {' '}
          <Text>
            {isExceeded 
              ? `exceeded: ` 
              : `left: `}
            <Text style={[
              styles.amountText,
              { color: getAmountColor() }
            ]}>
              ₹{Math.abs(amountDifference)}
            </Text>
            
          </Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  progressBackground: {
    height: 8,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  textContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  text: {
    fontSize: 12,
  },
  amountText: {
    fontSize: 12,
    fontWeight: 'bold',
  }
});

export default BudgetProgressBar; 