import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { auth, createUserWithEmailAndPassword } from '../../services/firebase';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import fontStyles from '../../utils/fontStyles'
import { RootStackParamList } from '../../types/navigation';

type SignupScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Signup'>;

export default function SignupScreen() {
  const navigation = useNavigation<SignupScreenNavigationProp>();
  const { isDarkMode } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
      // The navigation will be handled automatically by the AppNavigator
      // due to the user state change
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to sign up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className={`flex-1 px-6 ${isDarkMode ? 'bg-BackgroundDark' : 'bg-Background'}`}>
      <View className="flex-1 justify-center">
        <Text style={fontStyles('extrabold')}  className={`text-4xl mb-12 ${
          isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
        }`}>
          Create Account
        </Text>

        <View className="mb-6">
          <Text style={fontStyles('bold')}  className={`text-xl  mb-2 ${
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
          <Text style={fontStyles('bold')}  className={`text-xl  mb-2 ${
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
            placeholder="Create a password"
            placeholderTextColor={isDarkMode ? '#B0B0B0' : '#707070'}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <View className="mb-6">
          <Text style={fontStyles('bold')}  className={`text-xl  -medium mb-2 ${
            isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
          }`}>
            Confirm Password
          </Text>
           <TextInput style={fontStyles('medium')}
            className={`p-6 rounded-[20px] border-2 ${
              isDarkMode 
                ? 'border-SurfaceDark bg-SurfaceDark text-TextPrimaryDark' 
                : 'border-gray-300 bg-white text-TextPrimary'
            }`}
            placeholder="Confirm your password"
            placeholderTextColor={isDarkMode ? '#B0B0B0' : '#707070'}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        <TouchableOpacity
          onPress={handleSignup}
          disabled={loading}
          className={`py-5 rounded-[20px] mt-10 mb-4 ${
            isDarkMode ? 'bg-PrimaryDark' : 'bg-Primary'
          }`}
        >
          <Text style={fontStyles('bold')}  className="text-white text-center   text-xl">
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          className="py-4"
        >
          <Text style={fontStyles('bold')}  className={`text-center   ${
            isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
          }`}>
            Already have an account? Login
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
} 