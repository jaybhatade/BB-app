import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BudgetProgressBar from './BudgetProgressBar';
import { useTheme } from '../../contexts/ThemeContext';

interface BudgetItemProps {
  id: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  spent: number;
  budgetLimit: number;
  percentUsed: number;
  month: number;
  year: number;
  onEdit: (id: string) => void;
}

const BudgetItem: React.FC<BudgetItemProps> = ({
  id,
  categoryName,
  categoryIcon,
  categoryColor,
  spent,
  budgetLimit,
  percentUsed,
  month,
  year,
  onEdit
}) => {
  const { isDarkMode } = useTheme();
  
  // Get month name from month number
  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month];
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }
      ]}
    >
      <View style={styles.header}>
        <View style={styles.categoryInfo}>
          <View 
            style={[
              styles.iconContainer, 
              { borderColor: categoryColor, borderWidth: 2, justifyContent: 'center', alignItems: 'center' }
            ]}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 18 }}>{categoryIcon}</Text> 
            {/* categoryIcon is a text string, not an icon */}
          </View>
          <Text
            style={[
              styles.categoryName,
              { color: isDarkMode ? '#FFFFFF' : '#000000' }
            ]}
          >
            {categoryName}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={() => onEdit(id)}
        >
          <Ionicons 
            name="pencil" 
            size={18} 
            color={isDarkMode ? '#B0B0B0' : '#707070'} 
          />
        </TouchableOpacity>
      </View>
      
      <BudgetProgressBar 
        percentUsed={percentUsed} 
        spent={spent} 
        budgetLimit={budgetLimit} 
        categoryColor={categoryColor}
      />
      
      <Text
        style={[
          styles.dateRange,
          { color: isDarkMode ? '#B0B0B0' : '#707070' }
        ]}
      >
        {getMonthName(month)} {year}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
  },
  editButton: {
    padding: 4,
  },
  dateRange: {
    fontSize: 12,
    marginTop: 4,
  }
});

export default BudgetItem; 