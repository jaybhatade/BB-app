import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import fontStyles from '../../utils/fontStyles';

interface MonthSelectorProps {
  currentDate: Date;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
}

const MonthSelector: React.FC<MonthSelectorProps> = ({
  currentDate,
  onPreviousMonth,
  onNextMonth,
}) => {
  const { isDarkMode } = useTheme();
  
  // Format the month and year for display
  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <View className={`flex-row justify-between items-center py-3 px-4 mb-4 rounded-[20px] ${
      isDarkMode ? 'bg-slate-800' : 'bg-white'
    } shadow-md`}>
      <TouchableOpacity 
        className="p-2"
        onPress={onPreviousMonth}
      >
        <Ionicons 
          name="chevron-back" 
          size={24} 
          color={isDarkMode ? '#FFFFFF' : '#000000'} 
        />
      </TouchableOpacity>
      
      <Text 
        style={fontStyles('semibold')}
        className={`text-lg ${isDarkMode ? 'text-white' : 'text-black'}`}
      >
        {formatMonthYear(currentDate)}
      </Text>
      
      <TouchableOpacity 
        className="p-2"
        onPress={onNextMonth}
      >
        <Ionicons 
          name="chevron-forward" 
          size={24} 
          color={isDarkMode ? '#FFFFFF' : '#000000'} 
        />
      </TouchableOpacity>
    </View>
  );
};

export default MonthSelector;