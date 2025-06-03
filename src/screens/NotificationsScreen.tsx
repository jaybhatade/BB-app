import React, { useState } from 'react';
import { View, Text, RefreshControl, ScrollView, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationsScreen() {
  const { isDarkMode } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const bounceAnim = new Animated.Value(0);

  const onRefresh = () => {
    setRefreshing(true);
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.timing(bounceAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      })
    ]).start(() => {
      setRefreshing(false);
    });
  };

  return (
    <View className={`flex-1 ${isDarkMode ? 'bg-BackgroundDark' : 'bg-Background'}`}>
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{flexGrow: 1}}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDarkMode ? '#21965B' : '#21965B'}
          />
        }
      >
        <Animated.View 
          className="flex-1 items-center justify-center"
          style={{
            transform: [{
              scale: bounceAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0.95]
              })
            }]
          }}
        >
          <Ionicons 
            name="notifications-off-outline" 
            size={48} 
            color={isDarkMode ? '#21965B' : '#21965B'}
            style={{marginBottom: 16}}
          />
          <Text className={`text-lg font-montserrat-medium mb-2 ${
            isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
          }`}>
            No Notifications
          </Text>
          <Text className={`text-base font-montserrat text-center px-8 ${
            isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
          }`}>
            You'll see your notifications here
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}