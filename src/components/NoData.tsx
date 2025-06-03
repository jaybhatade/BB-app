import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface NoDataProps {
  message: string;
  icon?: string;
}

const NoData: React.FC<NoDataProps> = ({ 
  message, 
  icon = 'wallet-outline' 
}) => {
  const { isDarkMode } = useTheme();
  
  return (
    <View style={styles.container}>
      <Ionicons 
        name={icon as any} 
        size={64} 
        color={isDarkMode ? '#555555' : '#CCCCCC'} 
      />
      <Text 
        style={[
          styles.message,
          { color: isDarkMode ? '#999999' : '#888888' }
        ]}
      >
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default NoData; 