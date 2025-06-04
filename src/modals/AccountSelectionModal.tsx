import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { CheckCircle, X } from 'lucide-react-native';

interface Account {
  id: string;
  name: string;
  balance: number;
  icon: string;
}

interface AccountSelectionModalProps {
  accounts: Account[];
  accountId: string | null;
  setAccountId: (id: string) => void;
  setShowAccountModal: (show: boolean) => void;
  title?: string;
}

const AccountSelectionModal: React.FC<AccountSelectionModalProps> = ({ 
  accounts, 
  accountId, 
  setAccountId, 
  setShowAccountModal,
  title = "Select Account"
}) => {
  const { isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const handleAccountSelect = async (selectedAccountId: string) => {
    try {
      setIsLoading(true);
      setAccountId(selectedAccountId);
      setShowAccountModal(false);
    } catch (error) {
      console.error('Error selecting account:', error);
      Alert.alert('Error', 'Failed to select account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.modalContainer}
    >
      <View className={`rounded-tl-2xl rounded-tr-2xl p-5 max-h-[80%] min-h-[50%] ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
            {title}
          </Text>
          <TouchableOpacity 
            onPress={() => setShowAccountModal(false)}
            disabled={isLoading}
          >
            <X size={24} color={isDarkMode ? '#FFFFFF' : '#000000'} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={isDarkMode ? '#FFFFFF' : '#000000'} />
          </View>
        ) : (
          <FlatList
            data={accounts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.accountItem, { 
                  borderBottomColor: isDarkMode ? '#2E2E2E' : '#F0F0F0',
                  opacity: isLoading ? 0.5 : 1
                }]}
                onPress={() => handleAccountSelect(item.id)}
                disabled={isLoading}
              >
                <View style={[styles.accountIconContainer, { backgroundColor: '#21965B' }]}>
                  <Text style={{ fontSize: 20, color: '#FFFFFF' }}>{item.icon}</Text>
                </View>
                <View>
                  <Text style={[styles.accountName, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
                    {item.name}
                  </Text>
                  <Text style={styles.accountBalance}>Balance: ₹{item.balance}</Text>
                </View>
                {accountId === item.id && (
                  <View style={styles.selectedIndicator}>
                    <CheckCircle size={24} color="#21965B" />
                  </View>
                )}
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  accountIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '500',
  },
  accountBalance: {
    fontSize: 14,
    color: '#707070',
    marginTop: 2,
  },
  selectedIndicator: {
    marginLeft: 'auto',
  },
});

export default AccountSelectionModal;