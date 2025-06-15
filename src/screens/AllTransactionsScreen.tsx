import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Modal, Alert, RefreshControl } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getAllTransactions, getAllAccounts, getAllCategories, deleteTransaction, updateAccount } from '../../db/dbUtils';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import fontStyles from '../utils/fontStyles';

interface Transaction {
  id: string;
  userId: string;
  type: string;
  categoryId: string;
  subCategoryId: string;
  amount: number;
  accountId: string;
  date: string;
  notes?: string;
  linkedTransactionId?: string;
  title?: string;
}

interface GroupedTransactions {
  month: string;
  year: string;
  totalIncome: number;
  totalExpense: number;
  transactions: Transaction[];
}

interface Account {
  id: string;
  userId: string;
  name: string;
  balance: number;
  icon: string;
  createdAt: string;
  updatedAt: string;
  synced?: number;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: string;
}

export default function AllTransactionsScreen() {
  const { isDarkMode } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<{ [key: string]: Account }>({});
  const [categories, setCategories] = useState<{ [key: string]: Category }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income' | 'transfer'>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const transactionsData = await getAllTransactions();
      const sortedTransactions = transactionsData.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setTransactions(sortedTransactions);

      const accountsData = await getAllAccounts();
      const categoriesData = await getAllCategories();

      const accountsMap = accountsData.reduce<{ [key: string]: Account }>((acc, account) => {
        acc[account.id] = account;
        return acc;
      }, {});

      const categoriesMap = categoriesData.reduce<{ [key: string]: Category }>((acc, category) => {
        acc[category.id] = category;
        return acc;
      }, {});

      setAccounts(accountsMap);
      setCategories(categoriesMap);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = searchQuery.toLowerCase().trim() === '' ||
      categories[transaction.categoryId]?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      accounts[transaction.accountId]?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.notes?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterType === 'all' || 
      (filterType === 'transfer' && (transaction.type === 'debit' || transaction.type === 'credit')) ||
      transaction.type === filterType;

    return matchesSearch && matchesFilter;
  });

  const handleDeleteTransaction = async (transaction: Transaction) => {
    try {
      // Check if this is part of a transfer (either debit or credit)
      const isTransferTransaction = transaction.type === 'debit' || transaction.type === 'credit';
      
      if (isTransferTransaction && transaction.linkedTransactionId) {
        // Find the linked transaction
        const linkedTransaction = transactions.find(t => t.id === transaction.linkedTransactionId);
        
        if (linkedTransaction) {
          // Delete the linked transaction
          await deleteTransaction(linkedTransaction.id);
          
          // Reverse the account balance change for the linked transaction
          if (linkedTransaction.type === 'debit') {
            // Add the money back to the source account
            const fromAccount = accounts[linkedTransaction.accountId];
            await updateAccount({
              ...fromAccount,
              balance: fromAccount.balance + linkedTransaction.amount,
              updatedAt: new Date().toISOString()
            });
          } else if (linkedTransaction.type === 'credit') {
            // Remove the money from the destination account
            const toAccount = accounts[linkedTransaction.accountId];
            await updateAccount({
              ...toAccount,
              balance: toAccount.balance - linkedTransaction.amount,
              updatedAt: new Date().toISOString()
            });
          }
        }
      }
      
      // Update account balances based on transaction type
      if (transaction.type === 'debit') {
        // For debit (money leaving the account), add the money back
        const account = accounts[transaction.accountId];
        await updateAccount({
          ...account,
          balance: account.balance + transaction.amount,
          updatedAt: new Date().toISOString()
        });
      } else if (transaction.type === 'credit') {
        // For credit (money coming into the account), remove the money
        const account = accounts[transaction.accountId];
        await updateAccount({
          ...account,
          balance: account.balance - transaction.amount,
          updatedAt: new Date().toISOString()
        });
      } else if (transaction.type === 'expense') {
        // For expenses, add the money back
        const account = accounts[transaction.accountId];
        await updateAccount({
          ...account,
          balance: account.balance + transaction.amount,
          updatedAt: new Date().toISOString()
        });
      } else if (transaction.type === 'income') {
        // For income, remove the money
        const account = accounts[transaction.accountId];
        await updateAccount({
          ...account,
          balance: account.balance - transaction.amount,
          updatedAt: new Date().toISOString()
        });
      }

      // Delete the transaction
      await deleteTransaction(transaction.id);

      // Reload data
      loadData();
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
    const { isDarkMode } = useTheme();
    
    if (!transaction) return null;

    const account = accounts[transaction.accountId];
    const category = categories[transaction.categoryId];
    
    // Find linked transaction for transfers
    const linkedTransaction = transaction.linkedTransactionId 
      ? transactions.find(t => t.id === transaction.linkedTransactionId) 
      : null;
    
    const isTransfer = transaction.type === 'debit' || transaction.type === 'credit';
    const transferAccount = linkedTransaction ? accounts[linkedTransaction.accountId] : null;

    const getAmountColor = () => {
      if (transaction.type === 'debit') return '#FF3B30';
      if (transaction.type === 'credit') return '#21965B';
      return transaction.type === 'expense' ? '#FF3B30' : '#21965B';
    };

    const getTransactionIcon = () => {
      if (transaction.type === 'debit' || transaction.type === 'credit') return '↔️';
      return category?.icon || '💰';
    };

    const getTransactionTitle = () => {
      if (transaction.type === 'debit') return `Transfer to ${transferAccount?.name || 'Unknown Account'}`;
      if (transaction.type === 'credit') return `Transfer from ${transferAccount?.name || 'Unknown Account'}`;
      return category?.name || 'Unknown Category';
    };

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
            <View className={`flex-row justify-between items-center p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
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
                    borderColor: isTransfer ? '#9B59B6' : (category?.color || '#21965B'),
                    backgroundColor: isDarkMode ? '#1E1E1E' : '#F8F8F8'
                  }}
                >
                  <Text className="text-4xl">{getTransactionIcon()}</Text>
                </View>
                <Text className={`text-3xl font-montserrat-bold mb-1`} style={{ color: getAmountColor() }}>
                  {transaction.type === 'debit' || transaction.type === 'expense' ? '-' : '+'}₹{transaction.amount.toLocaleString()}
                </Text>
                <Text className={`font-montserrat-medium text-lg mb-2 ${
                  isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                }`}>
                  {getTransactionTitle()}
                </Text>
                <View className={`px-3 py-1 rounded-full ${
                  transaction.type === 'expense' || transaction.type === 'debit'
                    ? 'bg-red-100' 
                    : transaction.type === 'income' || transaction.type === 'credit'
                      ? 'bg-green-100' 
                      : 'bg-blue-100'
                }`}>
                  <Text className={`font-montserrat-medium text-xs ${
                    transaction.type === 'expense' || transaction.type === 'debit'
                      ? 'text-red-700' 
                      : transaction.type === 'income' || transaction.type === 'credit'
                        ? 'text-green-700' 
                        : 'text-blue-700'
                  }`}>
                    {transaction.type === 'debit' 
                      ? 'Transfer Out' 
                      : transaction.type === 'credit' 
                        ? 'Transfer In' 
                        : transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
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
                        {transaction.type === 'debit' ? 'From Account' : 'Account'}
                      </Text>
                    </View>
                    <Text className={`font-montserrat ${
                      isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                    }`}>
                      {account?.name || 'Unknown Account'}
                    </Text>
                  </View>

                  {isTransfer && linkedTransaction && (
                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center">
                        <Ionicons 
                          name={transaction.type === 'debit' ? "arrow-forward-circle-outline" : "arrow-back-circle-outline"}
                          size={20} 
                          color={isDarkMode ? '#AAAAAA' : '#666666'} 
                          className="mr-2"
                        />
                        <Text className={`font-montserrat-medium ${
                          isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
                        }`}>
                          {transaction.type === 'debit' ? 'To Account' : 'From Account'}
                        </Text>
                      </View>
                      <Text className={`font-montserrat ${
                        isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                      }`}>
                        {transferAccount?.name || 'Unknown Account'}
                      </Text>
                    </View>
                  )}

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

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const account = accounts[item.accountId];
    const category = categories[item.categoryId];
    
    // Find linked transaction for transfers
    const linkedTransaction = item.linkedTransactionId 
      ? transactions.find(t => t.id === item.linkedTransactionId) 
      : null;
    
    const isTransfer = item.type === 'debit' || item.type === 'credit';
    const transferAccount = linkedTransaction ? accounts[linkedTransaction.accountId] : null;

    const getTransactionTitle = () => {
      // If there's a title, show it
      if (item.title) {
        return item.title;
      }

      if (item.type === 'debit') return `Transfer to ${transferAccount?.name || 'Unknown Account'}`;
      if (item.type === 'credit') return `Transfer from ${transferAccount?.name || 'Unknown Account'}`;
      return category?.name || 'Unknown Category';
    };

    return (
      <TouchableOpacity
        onPress={() => navigation.navigate('TransactionDetail', { id: item.id })}
        className={`flex-row items-center justify-between ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'} rounded-2xl px-4 py-3 mb-3`}
      >
        <View>
          <Text style={fontStyles('semibold')} className={`${isDarkMode ? 'text-white' : 'text-black'} text-base`} numberOfLines={1}>
            {getTransactionTitle()}
          </Text>
          <Text style={fontStyles('regular')} className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-xs`}>
            {!isTransfer && category?.name ? `${category.name} • ` : ''}{account?.name || 'Unknown Account'}
          </Text>
        </View>
        <View>
          <Text style={fontStyles('extrabold')} className={`text-lg ${
            item.type === 'income' || item.type === 'credit' ? 'text-green-500' : 'text-red-500'
          }`}>
            ₹{item.amount.toLocaleString()}
          </Text>
          <Text style={fontStyles('regular')} className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-xs text-right`}>
            {formatDate(item.date)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const FilterModal = () => (
    <Modal
      visible={showFilterModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View className={`flex-1 justify-end ${isDarkMode ? 'bg-black/50' : 'bg-black/30'}`}>
        <View className={`rounded-t-3xl p-6 ${
          isDarkMode ? 'bg-BackgroundDark' : 'bg-Background'
        }`}>
          <View className="flex-row justify-between items-center mb-6">
            <Text className={`text-xl font-montserrat-bold ${
              isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
            }`}>
              Filter Transactions
            </Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Ionicons 
                name="close" 
                size={24} 
                color={isDarkMode ? '#FFFFFF' : '#000000'} 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className={`p-4 rounded-xl mb-2 ${
              filterType === 'all' 
                ? (isDarkMode ? 'bg-PrimaryDark' : 'bg-Primary')
                : (isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface')
            }`}
            onPress={() => {
              setFilterType('all');
              setShowFilterModal(false);
            }}
          >
            <Text className={`font-montserrat-medium ${
              filterType === 'all' ? 'text-white' : (isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary')
            }`}>
              All Transactions
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`p-4 rounded-xl mb-2 ${
              filterType === 'expense'
                ? (isDarkMode ? 'bg-PrimaryDark' : 'bg-Primary')
                : (isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface')
            }`}
            onPress={() => {
              setFilterType('expense');
              setShowFilterModal(false);
            }}
          >
            <Text className={`font-montserrat-medium ${
              filterType === 'expense' ? 'text-white' : (isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary')
            }`}>
              Expenses
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`p-4 rounded-xl mb-2 ${
              filterType === 'income'
                ? (isDarkMode ? 'bg-PrimaryDark' : 'bg-Primary')
                : (isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface')
            }`}
            onPress={() => {
              setFilterType('income');
              setShowFilterModal(false);
            }}
          >
            <Text className={`font-montserrat-medium ${
              filterType === 'income' ? 'text-white' : (isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary')
            }`}>
              Income
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`p-4 rounded-xl ${
              filterType === 'transfer'
                ? (isDarkMode ? 'bg-PrimaryDark' : 'bg-Primary')
                : (isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface')
            }`}
            onPress={() => {
              setFilterType('transfer');
              setShowFilterModal(false);
            }}
          >
            <Text className={`font-montserrat-medium ${
              filterType === 'transfer' ? 'text-white' : (isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary')
            }`}>
              Transfers
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const groupTransactionsByMonth = (transactions: Transaction[]): GroupedTransactions[] => {
    const groups: { [key: string]: GroupedTransactions } = {};

    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const month = date.toLocaleString('default', { month: 'long' });
      const year = date.getFullYear().toString();
      const key = `${month}-${year}`;

      if (!groups[key]) {
        groups[key] = {
          month,
          year,
          totalIncome: 0,
          totalExpense: 0,
          transactions: []
        };
      }

      groups[key].transactions.push(transaction);

      if (transaction.type === 'income' || transaction.type === 'credit') {
        groups[key].totalIncome += transaction.amount;
      } else if (transaction.type === 'expense' || transaction.type === 'debit') {
        groups[key].totalExpense += transaction.amount;
      }
    });

    return Object.values(groups).sort((a, b) => {
      const dateA = new Date(`${a.month} 1, ${a.year}`);
      const dateB = new Date(`${b.month} 1, ${b.year}`);
      return dateB.getTime() - dateA.getTime();
    });
  };

  const MonthHeader = ({ month, year, totalIncome, totalExpense }: { 
    month: string; 
    year: string; 
    totalIncome: number; 
    totalExpense: number;
  }) => {
    const netAmount = totalIncome - totalExpense;
    const isPositive = netAmount >= 0;

    return (
      <View className={`px-4 py-3 mb-2 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-200'} rounded-xl`}>
        <View className="flex-row justify-between items-center">
          <Text style={fontStyles('semibold')} className={`${isDarkMode ? 'text-white' : 'text-black'} text-base`}>
            {month} {year}
          </Text>
          <Text style={fontStyles('semibold')} className={`${isPositive ? 'text-green-500' : (isDarkMode ? 'text-white' : 'text-black')} text-base`}>
            {isPositive ? '+' : ''}₹{netAmount.toLocaleString()}
          </Text>
        </View>
        <View className="flex-row justify-between mt-1">
          <Text style={fontStyles('regular')} className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-xs`}>
            Income: ₹{totalIncome.toLocaleString()}
          </Text>
          <Text style={fontStyles('regular')} className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-xs`}>
            Expense: ₹{totalExpense.toLocaleString()}
          </Text>
        </View>
      </View>
    );
  };

  const renderItem = ({ item }: { item: GroupedTransactions }) => {
    return (
      <View>
        <MonthHeader
          month={item.month}
          year={item.year}
          totalIncome={item.totalIncome}
          totalExpense={item.totalExpense}
        />
        {item.transactions.map(transaction => (
          <View key={transaction.id}>
            {renderTransaction({ item: transaction })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View className={`flex-1 ${isDarkMode ? 'bg-BackgroundDark' : 'bg-Background'}`}>
      <View className="px-6 pt-12 pb-6 flex-1">
        <View className="flex-row items-center mb-6">
          <View className={`flex-1 flex-row items-center rounded-xl h-[55px] pl-3 mr-3 ${
            isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
          }`}>
            <Ionicons 
              name="search" 
              size={20} 
              color={isDarkMode ? '#B0B0B0' : '#707070'} 
            />
            <TextInput
              placeholder="Search transactions..."
              placeholderTextColor={isDarkMode ? '#B0B0B0' : '#707070'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              className={`flex-1 ml-2 font-montserrat ${
                isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
              }`}
            />
          </View>
          <TouchableOpacity
            onPress={() => setShowFilterModal(true)}
            className={`p-3 h-[55px] flex items-center justify-center rounded-xl ${
              isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
            }`}
          >
            <Ionicons 
              name="filter" 
              size={20} 
              color={isDarkMode ? '#B0B0B0' : '#707070'} 
            />
          </TouchableOpacity>
        </View>

        <FlatList
          data={groupTransactionsByMonth(filteredTransactions)}
          renderItem={renderItem}
          keyExtractor={(item) => `${item.month}-${item.year}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 16, paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[isDarkMode ? '#FFFFFF' : '#000000']}
              tintColor={isDarkMode ? '#FFFFFF' : '#000000'}
              progressBackgroundColor={isDarkMode ? '#1E1E1E' : '#F8F8F8'}
            />
          }
        />
      </View>
      <FilterModal />
    </View>
  );
}