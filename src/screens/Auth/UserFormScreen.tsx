import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useDatabase } from '../../contexts/DatabaseContext';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import fontStyles from '../../utils/fontStyles';
import { RootStackParamList } from '../../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import * as db from '../../../db/dbUtils';

type UserFormScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'UserForm'>;

const UserFormScreen: React.FC = () => {
  const navigation = useNavigation<UserFormScreenNavigationProp>();
  const { isDarkMode } = useTheme();
  const { user, setUserFormCompleted } = useAuth();
  const { isInitialized } = useDatabase();
  
  const [activeTab, setActiveTab] = useState(0);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleContinue = () => {
    if (!firstName || !lastName) {
      Alert.alert('Error', 'Please enter your first and last name');
      return;
    }
    
    // Just move to the next tab without saving data
    setActiveTab(1);
  };

  const handleFormSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setIsSubmitting(true);
      const currentDate = new Date().toISOString();
      
      // Save user data here at the final submission
      await db.addUser({
        id: `user_${user.uid.substring(0, 8)}`,
        userId: user.uid,
        firstName,
        lastName,
        phoneNumber,
        createdAt: currentDate,
        updatedAt: currentDate,
        synced: 0
      });

      // Set user form as completed
      setUserFormCompleted(true);
      setIsSubmitting(false);
      
      // Navigation will be handled by AppNavigator based on hasCompletedUserForm flag
    } catch (error) {
      console.error('Error during submission:', error);
      Alert.alert('Error', 'An error occurred during submission');
      setIsSubmitting(false);
    }
  };

  return (
    <View className={`flex-1 ${isDarkMode ? 'bg-BackgroundDark' : 'bg-Background'}`}>
      <View className="pt-20 px-6 pb-5">
        <Text style={fontStyles('bold')} className={`text-2xl font-montserrat-bold ${isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'}`}>
          Complete Your Profile
        </Text>
      </View>

      {/* Tabs */}
      <View className="flex-row mx-6 mb-5">
        <TouchableOpacity 
          className={`flex-1 py-3.5 items-center border-b-2 ${
            activeTab === 0 
              ? 'border-Primary' 
              : isDarkMode ? 'border-SurfaceDark' : 'border-Surface'
          }`}
          onPress={() => setActiveTab(0)}
          disabled={activeTab === 0}
        >
          <Text style={fontStyles('bold')} className={`text-xl font-montserrat-medium ${
            activeTab === 0 
              ? 'text-Primary font-montserrat-semibold' 
              : isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
          }`}>
            User Info
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className={`flex-1 py-3.5 items-center border-b-2 ${
            activeTab === 1 
              ? 'border-Primary' 
              : isDarkMode ? 'border-SurfaceDark' : 'border-Surface'
          }`}
          onPress={() => setActiveTab(1)}
          disabled={activeTab === 1 || !firstName || !lastName}
        >
          <Text style={fontStyles('bold')} className={`text-xl font-montserrat-medium ${
            activeTab === 1 
              ? 'text-Primary font-montserrat-semibold' 
              : isDarkMode ? 'text-TextSecondaryDark opacity-80' : 'text-TextSecondary opacity-80'
          }`}>
            Initial Balance
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView className="flex-1">
        {activeTab === 0 ? (
          /* User Info Tab */
          <View className="p-6">
                  <Text style={fontStyles('extrabold')} className={`text-4xl mb-143 
                     leading-relaxed ${isDarkMode ? 'text-OnBackgroundDark' : 'text-TextSecondary'}`}>
                  Tell us about you !
      </Text>      
            <View className="mb-5">
              <Text style={fontStyles('bold')} className={`text-xl  mb-2 ${isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'}`}>
                First Name
              </Text>
              
              <TextInput style={fontStyles('medium')}
                className={`border rounded-[20px] p-5 text-base ${
                  isDarkMode 
                    ? 'bg-SurfaceDark text-TextPrimaryDark border-SurfaceDark' 
                    : 'bg-Background text-TextPrimary border-Surface'
                }`}
                placeholder="First name (e.g., Aarav) "
                placeholderTextColor={isDarkMode ? '#909090' : '#A0A0A0'}
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>

            <View className="mb-5">
              <Text style={fontStyles('bold')} className={`text-xl font-montserrat-medium mb-2 ${isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'}`}>
                Last Name
              </Text>
              <TextInput style={fontStyles('medium')}
                className={`border rounded-[20px] p-5 text-base ${
                  isDarkMode 
                    ? 'bg-SurfaceDark text-TextPrimaryDark border-SurfaceDark' 
                    : 'bg-Background text-TextPrimary border-Surface'
                }`}
                placeholder="Last name (e.g., Kapoor)"
                placeholderTextColor={isDarkMode ? '#909090' : '#A0A0A0'}
                value={lastName}
                onChangeText={setLastName}
              />
            </View>

            <View className="mb-5">
              <Text style={fontStyles('bold')} className={`text-xl font-montserrat-medium mb-2 ${isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'}`}>
                Phone Number
              </Text>
              <TextInput style={fontStyles('medium')}
                className={`border rounded-[20px] p-5 text-base ${
                  isDarkMode 
                    ? 'bg-SurfaceDark text-TextPrimaryDark border-SurfaceDark' 
                    : 'bg-Background text-TextPrimary border-Surface'
                }`}
                placeholder="Contact number (e.g., 9876543210)"
                placeholderTextColor={isDarkMode ? '#909090' : '#A0A0A0'}
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />
            </View>

            <TouchableOpacity
              className={`p-5 rounded-[20px] items-center mt-16 ${
                (!firstName || !lastName) ? 'opacity-60' : 'opacity-100'
              } bg-Primary`}
              onPress={handleContinue}
              disabled={!firstName || !lastName}
            >
              <Text style={fontStyles('bold')} className="text-OnPrimary text-xl ">
                Continue
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Initial Balance Tab */
          <View className="p-6">
            <InitialBalanceContent 
              isDarkMode={isDarkMode} 
              onSubmit={handleFormSubmit} 
              user={user}
              onCancel={() => setActiveTab(0)}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// Component to use the InitialBalanceModal content directly in the tab
const InitialBalanceContent: React.FC<{
  isDarkMode: boolean;
  onSubmit: () => void;
  user: any;
  onCancel: () => void;
}> = ({ isDarkMode, onSubmit, user, onCancel }) => {
  const [cashBalance, setCashBalance] = useState('');
  const [bankBalance, setBankBalance] = useState('');
  const [accountsCreated, setAccountsCreated] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      // Parse input values
      const cashValue = cashBalance ? parseFloat(cashBalance) : 0;
      const bankValue = bankBalance ? parseFloat(bankBalance) : 0;

      // Create accounts
      const currentDate = new Date().toISOString();
      
      // Create cash account with user's UID plus identifier
      // Create cash account with user's UID plus identifier
await db.addAccount({
  id: `cash_${user.uid.substring(0, 8)}`,
  userId: user.uid,
  name: 'Cash',
  balance: cashValue,
  icon: '💵',
  createdAt: currentDate,
  updatedAt: currentDate,
  synced: 0
});

// Create bank account with user's UID plus identifier
await db.addAccount({
  id: `bank_${user.uid.substring(0, 8)}`,
  userId: user.uid,
  name: 'Bank Account',
  balance: bankValue,
  icon: '🏛️',
  createdAt: currentDate,
  updatedAt: currentDate,
  synced: 0
});


      setAccountsCreated(true);
      
      // Call the onSubmit callback after a slight delay
      setTimeout(() => {
        onSubmit();
      }, 1000);
      
    } catch (error) {
      console.error('Error creating initial accounts:', error);
      Alert.alert('Error', 'Failed to create accounts. Please try again.');
    }
  };

  return (
    <View>
      
      <Text style={fontStyles('bold')} className={`text-[20px] mb-6 leading-relaxed ${isDarkMode ? 'text-OnBackgroundDark' : 'text-TextSecondary'}`}>
        Set up initial balance to track your finances accurately!
      </Text>      

      {/* Cash Account */}
      <View className="mb-5">
        <View className="flex-row items-center mb-2">
          <Text style={fontStyles('bold')} className="text-xl mr-2">💵</Text>
          <Text style={fontStyles('bold')} className={`text-base font-montserrat-medium ${isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'}`}>
            Cash Balance
          </Text>
        </View>
        <TextInput style={fontStyles('medium')}
          className={`border rounded-[20px] p-5 text-base ${
            isDarkMode 
              ? 'bg-SurfaceDark text-TextPrimaryDark border-SurfaceDark' 
              : 'bg-Background text-TextPrimary border-Surface'
          }`}
          placeholder="Enter amount"
          placeholderTextColor={isDarkMode ? '#909090' : '#A0A0A0'}
          keyboardType="numeric"
          value={cashBalance}
          onChangeText={setCashBalance}
        />
      </View>

      {/* Bank Account */}
      <View className="mb-5">
        <View className="flex-row items-center mb-2">
          <Text style={fontStyles('bold')} className="text-xl mr-2">🏛️</Text>
          <Text style={fontStyles('bold')} className={`text-base font-montserrat-medium ${isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'}`}>
            Bank Account Balance
          </Text>
        </View>
        <TextInput style={fontStyles('medium')}
          className={`border rounded-[20px] p-5 text-base ${
            isDarkMode 
              ? 'bg-SurfaceDark text-TextPrimaryDark border-SurfaceDark' 
              : 'bg-Background text-TextPrimary border-Surface'
          }`}
          placeholder="Enter amount"
          placeholderTextColor={isDarkMode ? '#909090' : '#A0A0A0'}
          keyboardType="numeric"
          value={bankBalance}
          onChangeText={setBankBalance}
        />
      </View>

      <Text style={fontStyles('bold')} className={`text-base mb-6 leading-relaxed ${isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'}`}>
        You can update or add more accounts later
      </Text>
      {accountsCreated ? (
        <View className="items-center mt-6 p-5">
          <Ionicons name="checkmark-circle" size={48} color="#21965B" />
          <Text style={fontStyles('bold')} className={`mt-3 text-base font-montserrat-medium text-center ${isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'}`}>
            Accounts created successfully!
          </Text>
        </View>
      ) : (
        <View className="flex-row justify-between mt-4">
          <TouchableOpacity
            className={`flex-1 p-3 rounded-[20px] items-center mr-3 border ${
              isDarkMode ? 'border-SurfaceDark' : 'border-Surface'
            }`}
            onPress={onCancel}
          >
            <Text style={fontStyles('bold')} className={`text-base font-montserrat-semibold ${
              isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
            }`}>
              Back
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="flex-1 p-5 rounded-[20px] items-center bg-Primary"
            onPress={handleSubmit}
          >
            <Text style={fontStyles('bold')} className="text-OnPrimary text-base font-montserrat-semibold">
              Submit
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default UserFormScreen;