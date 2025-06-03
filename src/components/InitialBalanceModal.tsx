import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import * as db from '../../db/dbUtils';

interface InitialBalanceModalProps {
  visible: boolean;
  onClose: () => void;
}

const InitialBalanceModal: React.FC<InitialBalanceModalProps> = ({ visible, onClose }) => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [cashBalance, setCashBalance] = useState('');
  const [bankBalance, setBankBalance] = useState('');
  const [accountsCreated, setAccountsCreated] = useState(false);

  useEffect(() => {
    if (visible) {
      // Reset values when modal opens
      setCashBalance('');
      setBankBalance('');
      setAccountsCreated(false);
    }
  }, [visible]);

  const handleSubmit = async () => {
    try {
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      // Parse input values
      const cashValue = cashBalance ? parseFloat(cashBalance) : 0;
      const bankValue = bankBalance ? parseFloat(bankBalance) : 0;

      // Create accounts
      const currentDate = new Date().toISOString();
      
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
      
      // Close the modal after a slight delay
      setTimeout(() => {
        onClose();
      }, 1000);
      
    } catch (error) {
      console.error('Error creating initial accounts:', error);
      Alert.alert('Error', 'Failed to create accounts. Please try again.');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        activeOpacity={1} 
        onPress={onClose}
        style={styles.modalContainer}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={e => e.stopPropagation()}
          style={[
            styles.modalContent,
            { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF' }
          ]}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={[
                styles.title,
                { color: isDarkMode ? '#FFFFFF' : '#000000' }
              ]}>
                Set Initial Account Balances
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons 
                  name="close" 
                  size={24} 
                  color={isDarkMode ? '#FFFFFF' : '#000000'} 
                />
              </TouchableOpacity>
            </View>

            <Text style={[
              styles.description,
              { color: isDarkMode ? '#B0B0B0' : '#707070' }
            ]}>
              Let's set up your accounts with their current balances to track your finances accurately.
            </Text>

            {/* Cash Account */}
            <View style={styles.inputContainer}>
              <View style={styles.labelContainer}>
                <Text style={[
                  styles.emoji,
                ]}>💵</Text>
                <Text style={[
                  styles.label,
                  { color: isDarkMode ? '#FFFFFF' : '#000000' }
                ]}>Cash Balance</Text>
              </View>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: isDarkMode ? '#2C2C2C' : '#F5F5F5',
                    color: isDarkMode ? '#FFFFFF' : '#000000',
                    borderColor: isDarkMode ? '#3E3E3E' : '#E0E0E0'
                  }
                ]}
                placeholder="Enter amount"
                placeholderTextColor={isDarkMode ? '#909090' : '#A0A0A0'}
                keyboardType="numeric"
                value={cashBalance}
                onChangeText={setCashBalance}
              />
            </View>

            {/* Bank Account */}
            <View style={styles.inputContainer}>
              <View style={styles.labelContainer}>
                <Text style={[
                  styles.emoji,
                ]}>🏛️</Text>
                <Text style={[
                  styles.label,
                  { color: isDarkMode ? '#FFFFFF' : '#000000' }
                ]}>Bank Account Balance</Text>
              </View>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: isDarkMode ? '#2C2C2C' : '#F5F5F5',
                    color: isDarkMode ? '#FFFFFF' : '#000000',
                    borderColor: isDarkMode ? '#3E3E3E' : '#E0E0E0'
                  }
                ]}
                placeholder="Enter amount"
                placeholderTextColor={isDarkMode ? '#909090' : '#A0A0A0'}
                keyboardType="numeric"
                value={bankBalance}
                onChangeText={setBankBalance}
              />
            </View>

            {accountsCreated ? (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={48} color="#21965B" />
                <Text style={[
                  styles.successText,
                  { color: isDarkMode ? '#FFFFFF' : '#000000' }
                ]}>Accounts created successfully!</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: '#21965B' }
                ]}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>Save Balances</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  emoji: {
    fontSize: 20,
    marginRight: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  submitButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    padding: 16,
  },
  successText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  }
});

export default InitialBalanceModal; 