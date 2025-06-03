import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

interface BudgetSummaryProps {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  budgetCount: number;
}

const BudgetSummary: React.FC<BudgetSummaryProps> = ({
  totalBudget,
  totalSpent,
  totalRemaining,
  budgetCount
}) => {
  const { isDarkMode } = useTheme();
  
  const percentUsed = totalBudget > 0 
    ? Math.min(100, (totalSpent / totalBudget) * 100) 
    : 0;
  
  // Determine the color based on the percentage used
  const getProgressColor = () => {
    if (percentUsed < 50) return '#21965B'; // Green - good
    if (percentUsed < 80) return '#FFB347'; // Orange - warning
    return '#FF6B6B'; // Red - critical
  };

  return (
    <View 
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }
      ]}
    >
      <Text 
        style={[
          styles.title,
          { color: isDarkMode ? '#FFFFFF' : '#000000' }
        ]}
      >
        Budget Overview
      </Text>
      
      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text 
            style={[
              styles.statValue,
              { color: '#21965B' }
            ]}
          >
            ₹{totalBudget}
          </Text>
          <Text 
            style={[
              styles.statLabel,
              { color: isDarkMode ? '#B0B0B0' : '#707070' }
            ]}
          >
            Total Budget
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text 
            style={[
              styles.statValue,
              { color: totalSpent > 0 ? '#FF6B6B' : getProgressColor() }
            ]}
          >
            ₹{totalSpent}
          </Text>
          <Text 
            style={[
              styles.statLabel,
              { color: isDarkMode ? '#B0B0B0' : '#707070' }
            ]}
          >
            Total Spent
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text 
            style={[
              styles.statValue,
              { color: totalRemaining >= 0 ? '#21965B' : '#FF6B6B' }
            ]}
          >
            ₹{Math.abs(totalRemaining)}
          </Text>
          <Text 
            style={[
              styles.statLabel,
              { color: isDarkMode ? '#B0B0B0' : '#707070' }
            ]}
          >
            {totalRemaining >= 0 ? 'Remaining' : 'Exceeded'}
          </Text>
        </View>
      </View>
      
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View 
          style={[
            styles.progressBackground,
            { backgroundColor: isDarkMode ? '#333333' : '#E0E0E0' }
          ]}
        >
          <View 
            style={[
              styles.progressFill,
              { 
                width: `${percentUsed}%`,
                backgroundColor: getProgressColor()
              }
            ]} 
          />
        </View>
        <Text 
          style={[
            styles.progressText,
            { color: isDarkMode ? '#FFFFFF' : '#000000' }
          ]}
        >
          {percentUsed}% used
        </Text>
      </View>
      
      <Text 
        style={[
          styles.budgetCount,
          { color: isDarkMode ? '#B0B0B0' : '#707070' }
        ]}
      >
        {budgetCount} active {budgetCount === 1 ? 'budget' : 'budgets'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBackground: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: 12,
    textAlign: 'right',
  },
  budgetCount: {
    fontSize: 12,
    textAlign: 'center',
  }
});

export default BudgetSummary; 