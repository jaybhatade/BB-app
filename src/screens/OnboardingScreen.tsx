import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import fontStyles from '../utils/fontStyles'
import { RootStackParamList } from '../types/navigation';
import { SafeAreaView } from 'react-native-safe-area-context';

type OnboardingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

export default function OnboardingScreen() {
  const navigation = useNavigation<OnboardingScreenNavigationProp>();
  const { isDarkMode } = useTheme();

  return (
    <SafeAreaView className={`flex-1 ${isDarkMode ? 'bg-BackgroundDark' : 'bg-Background'}`} edges={['top']}>
      <View className="flex-1 justify-start  items-center px-6">
        <Text style={fontStyles('extrabold')} className={`text-4xl  text-center mb-4 ${
          isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
        }`}>
          Welcome to BloomBudget
        </Text>
        <Text style={fontStyles('medium')} className={`text-xl  text-center mb-8 ${
          isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
        }`}>
          Your personal finance companion for smarter spending and better saving
        </Text>
          <Image
            source={require('../../assets/images/money-bag.png')}
            style={{ height: 250, width: 250 }}
            resizeMode="contain"
          />
      </View>

      <View className="px-6 pb-20">

        <TouchableOpacity
          onPress={() => navigation.navigate('Signup')}
          className={`py-4 rounded-[20px]  mb-6 ${
            isDarkMode 
              ? 'bg-PrimaryDark' 
              : 'bg-PrimaryDark'
          }`}
        >
          <Text style={fontStyles('bold')} className={`text-center text-xl ${
            isDarkMode ? 'text-white' : 'text-Primary'
          }`}>
            Get Started
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          className={`py-4 rounded-[20px] border-2 ${
            isDarkMode ? 'border-PrimaryDark' : 'bg-Primary'
          }`}
        >
          <Text style={fontStyles('bold')} className="text-Primary text-center  text-xl">
            Login
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
} 