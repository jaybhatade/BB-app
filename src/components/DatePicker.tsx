import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../contexts/ThemeContext';
import fontStyles from '@/utils/fontStyles';
import { Sparkle, CalendarDays } from 'lucide-react-native';


interface DatePickerProps {
  date: Date;
  onChange: (date: Date) => void;
  label: string;
}

const DatePicker: React.FC<DatePickerProps> = ({ date, onChange, label }) => {
  const { isDarkMode } = useTheme();
  const [show, setShow] = React.useState(false);

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShow(Platform.OS === 'ios');
    onChange(currentDate);
  };

  const showDatepicker = () => {
    setShow(true);
  };

  return (
    <View style={{ marginBottom: 20 }}>
      <Text 
      className={`{  text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}
      style={fontStyles('extrabold')}>
        {label}
      </Text>
      <TouchableOpacity
        onPress={showDatepicker}

        className={`rounded-full flex-row items-center justify-between p-4 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}

      >
        <Text         
        className={`{  text-lg ${isDarkMode ? 'text-white' : 'text-black'}`}
        style={fontStyles('bold')}>
          {date.toLocaleDateString()}
        </Text>
<CalendarDays color={isDarkMode ? 'white' : 'black'} size={24} />
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
        />
      )}
    </View>
  );
};

export default DatePicker;