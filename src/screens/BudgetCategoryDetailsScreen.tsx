import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { PieChart } from 'react-native-gifted-charts';
import { useTheme } from '../contexts/ThemeContext';
import * as transactionDb from '../../db/transaction-management';
import * as budgetDb from '../../db/budget-management';
import type { RootStackParamList } from '../types/navigation';
import type { Transaction } from '../../db/types';
import fontStyles from '@/utils/fontStyles';
import { ChevronLeft, Pencil } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BudgetForm from '../components/BudgetComponents/BudgetForm';
import { Ionicons } from '@expo/vector-icons';
import { getAllAccounts, deleteTransaction, updateAccount } from '../../db/dbUtils';

const BudgetCategoryDetailsScreen = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'BudgetCategoryDetails'>>();
  const navigation = useNavigation();
  const { isDarkMode } = useTheme();
  const { budget, category } = route.params as { budget: any; category: any };
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [accounts, setAccounts] = useState<{ [key: string]: any }>({});
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const txns = await transactionDb.getTransactionsByCategoryId(category.id);
      // Filter by userId, month, year
      const filtered = txns.filter(t => t.userId === budget.userId && new Date(t.date).getMonth() === budget.month && new Date(t.date).getFullYear() === budget.year);
      setTransactions(filtered);

      // Fetch accounts
      const accountsData = await getAllAccounts();
      const accountsMap = accountsData.reduce<{ [key: string]: any }>((acc, account) => {
        acc[account.id] = account;
        return acc;
      }, {});
      setAccounts(accountsMap);
    };
    fetchData();
  }, [budget, category]);

  const handleEditBudget = () => {
    setIsEditing(true);
    setShowBudgetForm(true);
  };

  const handleSaveBudget = async (updatedBudget: any) => {
    try {
      if (isEditing) {
        await budgetDb.updateBudget(updatedBudget);
      }
      setShowBudgetForm(false);
      setIsEditing(false);
      // Refresh the screen or navigate back
      navigation.goBack();
    } catch (error) {
      console.error('Error saving budget:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  };

  const available = budget.budgetLimit - budget.spent;
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const currentMonth = monthNames[budget.month];

  const handleDeleteTransaction = async (transaction: Transaction) => {
    try {
      // Update account balance
      const account = accounts[transaction.accountId];
      if (account) {
        await updateAccount({
          ...account,
          balance: account.balance + transaction.amount,
          updatedAt: new Date().toISOString()
        });
      }

      // Delete the transaction
      await deleteTransaction(transaction.id);

      // Update local state
      setTransactions(prev => prev.filter(t => t.id !== transaction.id));
      setShowDetailsModal(false);
      setSelectedTransaction(null);
      
      Alert.alert('Success', 'Transaction deleted successfully');
    } catch (error) {
      console.error('Error deleting transaction:', error);
      Alert.alert('Error', 'Failed to delete transaction');
    }
  };

  const TransactionDetailsModal = ({ 
    visible, 
    onClose, 
    transaction 
  }: { 
    visible: boolean; 
    onClose: () => void; 
    transaction: Transaction | null;
  }) => {
    if (!transaction) return null;

    const account = accounts[transaction.accountId];
    
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View className={`flex-1 justify-end ${isDarkMode ? 'bg-black/50' : 'bg-black/30'}`}>
          <View className={`rounded-t-3xl ${
            isDarkMode ? 'bg-SurfaceDark' : 'bg-Background'
          }`}>
            <View className="flex-row justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <Text className={`text-xl font-montserrat-bold ${
                isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
              }`}>
                Transaction Details
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons 
                  name="close" 
                  size={24} 
                  color={isDarkMode ? '#FFFFFF' : '#000000'} 
                />
              </TouchableOpacity>
            </View>

            <View className="p-6">
              <View className="items-center mb-6">
                <View 
                  className={`w-24 h-24 rounded-full items-center justify-center mb-4 border-2 shadow-sm`}
                  style={{ 
                    borderColor: category?.color || '#21965B',
                    backgroundColor: isDarkMode ? '#1E1E1E' : '#F8F8F8'
                  }}
                >
                  <Text className="text-4xl">{category?.icon || '💰'}</Text>
                </View>
                <Text className={`text-3xl font-montserrat-bold mb-1`} style={{ color: '#FF3B30' }}>
                  -₹{transaction.amount.toLocaleString()}
                </Text>
                <Text className={`font-montserrat-medium text-lg mb-2 ${
                  isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                }`}>
                  {transaction.title || category.name}
                </Text>
                <View className="px-3 py-1 rounded-full bg-red-100">
                  <Text className="font-montserrat-medium text-xs text-red-700">
                    Expense
                  </Text>
                </View>
              </View>

              <View className={`p-4 rounded-xl ${
                isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
              }`}>
                <View className="space-y-4 gap-4">
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      <Ionicons 
                        name="calendar-outline" 
                        size={20} 
                        color={isDarkMode ? '#AAAAAA' : '#666666'} 
                        className="mr-2"
                      />
                      <Text className={`font-montserrat-medium ${
                        isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
                      }`}>
                        Date
                      </Text>
                    </View>
                    <Text className={`font-montserrat ${
                      isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                    }`}>
                      {formatDate(transaction.date)}
                    </Text>
                  </View>

                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center">
                      <Ionicons 
                        name="wallet-outline" 
                        size={20} 
                        color={isDarkMode ? '#AAAAAA' : '#666666'} 
                        className="mr-2"
                      />
                      <Text className={`font-montserrat-medium ${
                        isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
                      }`}>
                        Account
                      </Text>
                    </View>
                    <Text className={`font-montserrat ${
                      isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                    }`}>
                      {account?.name || 'Unknown Account'}
                    </Text>
                  </View>

                  {transaction.notes && (
                    <View>
                      <View className="flex-row items-center mb-2">
                        <Ionicons 
                          name="document-text-outline" 
                          size={20} 
                          color={isDarkMode ? '#AAAAAA' : '#666666'} 
                          className="mr-2"
                        />
                        <Text className={`font-montserrat-medium ${
                          isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
                        }`}>
                          Notes
                        </Text>
                      </View>
                      <Text className={`font-montserrat ${
                        isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                      }`}>
                        {transaction.notes}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    'Delete Transaction',
                    'Are you sure you want to delete this transaction?',
                    [
                      {
                        text: 'Cancel',
                        style: 'cancel'
                      },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => handleDeleteTransaction(transaction)
                      }
                    ]
                  );
                }}
                className={`mt-8 p-4 rounded-xl border border-red-500 mb-4`}
              >
                <Text className="text-red-500 font-montserrat-semibold text-center">
                  Delete Transaction
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <ChevronLeft size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity onPress={handleEditBudget}>
              <Pencil size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View>
          <Text style={[fontStyles('bold'), { color: '#fff', fontSize: 32, marginTop: 24 }]}>{category.name}</Text>
        </View>

        {/* Pie Chart */}
        <View style={{ alignItems: 'center', marginBottom: 24, marginTop: 40 }}>
          <PieChart
            data={[
              { value: budget.spent, color: '#FF3B30' },
              { value: available, color: '#1E293B' },
            ]}
            radius={100}
            innerRadius={80}
            centerLabelComponent={() => (
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Text style={[fontStyles('bold'), { color: '#fff', fontSize: 32 }]}>₹{available}</Text>
                <Text style={[fontStyles('bold'), { color: '#fff', fontSize: 12 }]}>available out of ₹{budget.budgetLimit}</Text>
              </View>
            )}
            backgroundColor="#0F172A"
          />
        </View>

        {/* Transactions */}
        <Text style={[fontStyles('bold'), { color: '#fff', fontSize: 18, marginBottom: 12 }]}>Transactions</Text>
        {transactions.length === 0 ? (
          <Text style={[fontStyles('bold'), { color: '#fff', opacity: 0.5 }]}>No transactions found.</Text>
        ) : (
          transactions.map((txn, idx) => (
            <TouchableOpacity
              key={txn.id || idx}
              onPress={() => {
                setSelectedTransaction(txn);
                setShowDetailsModal(true);
              }}
              style={{ backgroundColor: '#1E293B', borderRadius: 16, padding: 16, marginBottom: 12 }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={[fontStyles('bold'), { color: '#fff', fontSize: 16 }]}>{txn.title || 'Transaction'}</Text>
                  <Text style={[fontStyles('bold'), { color: '#94A3B8', fontSize: 12 }]}>{category.name} • {accounts[txn.accountId]?.name || 'Unknown Account'}</Text>
                </View>
                <Text style={[fontStyles('bold'), { color: '#FF3B30', fontSize: 18 }]}>-₹{txn.amount}</Text>
              </View>
              <Text style={[fontStyles('bold'), { color: '#94A3B8', fontSize: 12, marginTop: 4 }]}>{formatDate(txn.date)}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Budget Form Modal */}
      <BudgetForm
        visible={showBudgetForm}
        onClose={() => {
          setShowBudgetForm(false);
          setIsEditing(false);
        }}
        onSave={handleSaveBudget}
        editBudget={isEditing ? budget : undefined}
        onDelete={() => {}}
      />

      {/* Transaction Details Modal */}
      <TransactionDetailsModal
        visible={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
      />
    </SafeAreaView>
  );
};

export default BudgetCategoryDetailsScreen;