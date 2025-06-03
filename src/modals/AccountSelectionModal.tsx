import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { CheckCircle, X } from 'lucide-react-native';

const AccountSelectionModal = ({ 
  accounts, 
  accountId, 
  setAccountId, 
  setShowAccountModal,
  title = "Select Account"
}) => {
  const { isDarkMode } = useTheme();

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.modalContainer}
    >
      <View className={`rounded-tl-2xl rounded-tr-2xl p-5 max-h-[80%] min-h-[50%] ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>{title}</Text>
          <TouchableOpacity onPress={() => setShowAccountModal(false)}>
            <X size={24} color={isDarkMode ? '#FFFFFF' : '#000000'} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={accounts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.accountItem, { borderBottomColor: isDarkMode ? '#2E2E2E' : '#F0F0F0' }]}
              onPress={() => {
                setAccountId(item.id);
                setShowAccountModal(false);
              }}
            >
              <View style={styles.accountIconContainer}>
                <Text style={{ fontSize: 20, color: '#FFFFFF' }}>{item.icon}</Text>
              </View>
              <View>
                <Text style={[styles.accountName, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>{item.name}</Text>
                <Text style={styles.accountBalance}>Balance: ₹{item.balance}</Text>
              </View>
              {accountId === item.id && (
                <View style={styles.selectedIndicator}>
                  <CheckCircle size={24} color="#21965B" />
                </View>
              )}
            </TouchableOpacity>
          )}
        />
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
    backgroundColor: '#21965B',
  },
  accountName: {
    fontSize: 16,
  },
  accountBalance: {
    fontSize: 14,
    color: '#707070',
  },
  selectedIndicator: {
    marginLeft: 'auto',
  },
});

export default AccountSelectionModal;