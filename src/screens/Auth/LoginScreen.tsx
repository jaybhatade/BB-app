import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { auth, signInWithEmailAndPassword } from '../../services/firebase';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import fontStyles from '../../utils/fontStyles';
import { RootStackParamList } from '../../types/navigation';

type LoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

export default function LoginScreen() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { isDarkMode } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      // The navigation will be handled automatically by the AppNavigator
      // due to the user state change
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className={`flex-1 px-6 ${isDarkMode ? 'bg-BackgroundDark' : 'bg-Background'}`}>
      <View className="flex-1 justify-center">
         <Text style={fontStyles('extrabold')} className={`text-4xl mb-12 ${
          isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
        }`}>
          Welcome Back
        </Text>

        <View className="mb-6">
           <Text style={fontStyles('bold')} className={`text-xl font-montserrat-medium mb-2 ${
            isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
          }`}>
            Email
          </Text>
           <TextInput style={fontStyles('medium')}
            className={`p-6 rounded-[20px] border-2 ${
              isDarkMode 
                ? 'border-SurfaceDark bg-SurfaceDark text-TextPrimaryDark' 
                : 'border-gray-300 bg-white text-TextPrimary'
            }`}
            placeholder="Enter your email"
            placeholderTextColor={isDarkMode ? '#B0B0B0' : '#707070'}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View className="mb-6">
           <Text style={fontStyles('bold')} className={`text-lg font-montserrat-medium mb-2 ${
            isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
          }`}>
            Password
          </Text>
           <TextInput style={fontStyles('medium')}
            className={`p-6 rounded-[20px] border-2 ${
              isDarkMode 
                ? 'border-SurfaceDark bg-SurfaceDark text-TextPrimaryDark' 
                : 'border-gray-300 bg-white text-TextPrimary'
            }`}
            placeholder="Enter your password"
            placeholderTextColor={isDarkMode ? '#B0B0B0' : '#707070'}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          className={`py-5 rounded-[20px] mt-10 mb-4 ${
            isDarkMode ? 'bg-PrimaryDark' : 'bg-Primary'
          }`}
        >
           <Text style={fontStyles('bold')} className="text-white text-center  text-2xl">
            {loading ? 'Logging in...' : 'Login'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Signup')}
          className="py-4"
        >
           <Text style={fontStyles('medium')} className={`text-center text-xl ${
            isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
          }`}>
            Don't have an account? Sign Up
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
} 