import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Modal, 
  ScrollView,
  Switch
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import * as db from '../../../db/dbUtils';
import { useAuth } from '../../contexts/AuthContext';
import CategorySelectionTrigger from '../CategorySelectionTrigger';
import { X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react-native';
import fontStyles from '../../utils/fontStyles';

interface BudgetFormProps {
  visible: boolean;
  onClose: () => void;
  onSave: (budget: any) => void;
  onDelete: (budget: any) => void;
  editBudget?: any;
}

const BudgetForm: React.FC<BudgetFormProps> = ({ 
  visible, 
  onClose, 
  onSave,
  onDelete,
  editBudget 
}) => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const userId = user?.uid || '';
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [budgetLimit, setBudgetLimit] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [showCategories, setShowCategories] = useState<boolean>(false);
  const [isRecurring, setIsRecurring] = useState<boolean>(false);

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const allCategories = await db.getAllCategories();
        // Only include expense categories
        const expenseCategories = allCategories.filter(cat => cat.type === 'expense');
        setCategories(expenseCategories);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };

    loadCategories();
  }, []);

  // Set form values when editing an existing budget
  useEffect(() => {
    if (editBudget) {
      setSelectedCategory(editBudget.categoryId);
      setBudgetLimit(editBudget.budgetLimit.toString());
      setSelectedMonth(editBudget.month);
      setSelectedYear(editBudget.year);
    }
  }, [editBudget]);

  // Reset form when closed
  useEffect(() => {
    if (!visible) {
      if (!editBudget) {
        resetForm();
      }
    }
  }, [visible]);

  const resetForm = () => {
    setSelectedCategory('');
    setBudgetLimit('');
    setSelectedMonth(new Date().getMonth());
    setSelectedYear(new Date().getFullYear());
    setIsRecurring(false);
  };

  const handleSave = () => {
    if (!selectedCategory || !budgetLimit) {
      // Show validation error
      return;
    }

    if (isRecurring) {
      // Create budgets for current month through December of the selected year
      const budgets = [];
      for (let month = selectedMonth; month <= 11; month++) {
        const budget = {
          id: `budget_${Date.now()}_${month}`,
          userId: userId,
          categoryId: selectedCategory,
          budgetLimit: parseFloat(budgetLimit),
          month: month,
          year: selectedYear,
          createdAt: new Date().toISOString(),
          isRecurring: true
        };
        budgets.push(budget);
      }
      budgets.forEach(budget => onSave(budget));
    } else {
    const budget = {
      id: editBudget ? editBudget.id : `budget_${Date.now()}`,
      userId: userId,
      categoryId: selectedCategory,
      budgetLimit: parseFloat(budgetLimit),
      month: selectedMonth,
      year: selectedYear,
        createdAt: editBudget ? editBudget.createdAt : new Date().toISOString(),
        isRecurring: false
    };
    onSave(budget);
    }

    if (!editBudget) resetForm();
    onClose();
  };

  const handleDelete = () => {
    if (editBudget) {
      onDelete(editBudget);
      onClose();
    }
  };

  const getCategoryById = (id: string) => {
    return categories.find(cat => cat.id === id);
  };

  // Get month name from month number
  const getMonthName = (month: number) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month];
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className={`rounded-t-[20px] p-5 max-h-[80%] ${isDarkMode ? 'bg-[#1E293B]' : 'bg-white'}`}>
          <View className="flex-row justify-between items-center mb-5">
            <Text 
              style={fontStyles('bold')}
              className={`text-xl ${isDarkMode ? 'text-white' : 'text-black'}`}
            >
              {editBudget ? 'Edit Budget' : 'Create Budget'}
            </Text>
            <View className="flex-row items-center gap-4">
              {editBudget && (
                <TouchableOpacity 
                  onPress={handleDelete}
                  className="p-1"
                >
                  <Trash2 
                    size={24} 
                    color={isDarkMode ? '#FFFFFF' : '#000000'} 
                  />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={onClose}>
                <X 
                  size={24} 
                  color={isDarkMode ? '#FFFFFF' : '#000000'} 
                />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView className="max-h-[90%]">
            {/* Category Selection */}
            <View className="mb-5">
              <Text 
                style={fontStyles('medium')}
                className={`text-base mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}
              >
                Category
              </Text>
              <CategorySelectionTrigger 
                selectedCategory={selectedCategory}
                onCategorySelect={(categoryId) => setSelectedCategory(categoryId)}
                categoryType="expense"
                buttonLabel="Select budget category"
                getCategoryById={getCategoryById}
              />
            </View>

            {/* Budget Limit */}
            <View className="mb-5">
              <Text 
                style={fontStyles('medium')}
                className={`text-base mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}
              >
                Budget Limit (₹)
              </Text>
              <TextInput
                className={`border rounded-[20px] p-3 text-base ${
                  isDarkMode 
                    ? 'bg-[#334155] text-white border-[#475569]' 
                    : 'bg-[#F5F5F5] text-black border-[#DDDDDD]'
                }`}
                placeholder="Enter amount"
                placeholderTextColor={isDarkMode ? '#B0B0B0' : '#707070'}
                keyboardType="numeric"
                value={budgetLimit}
                onChangeText={setBudgetLimit}
              />
            </View>

            {/* Month and Year Selection */}
            <View className="mb-5">
              <Text 
                style={fontStyles('medium')}
                className={`text-base mb-2 ${isDarkMode ? 'text-white' : 'text-black'}`}
              >
                Month and Year
              </Text>
              <View className="flex-row justify-between">
                <View className="flex-row items-center border rounded-[20px] p-2 flex-1 mr-2 justify-between border-[#DDDDDD]">
                  <TouchableOpacity
                    onPress={() => {
                      if (selectedMonth === 0) {
                        setSelectedMonth(11);
                        setSelectedYear(selectedYear - 1);
                      } else {
                        setSelectedMonth(selectedMonth - 1);
                      }
                    }}
                    className="p-1"
                  >
                    <ChevronLeft 
                      size={20} 
                      color={isDarkMode ? '#FFFFFF' : '#000000'} 
                    />
                  </TouchableOpacity>
                  <Text 
                    style={fontStyles('medium')}
                    className={`text-base ${isDarkMode ? 'text-white' : 'text-black'}`}
                  >
                    {getMonthName(selectedMonth)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      if (selectedMonth === 11) {
                        setSelectedMonth(0);
                        setSelectedYear(selectedYear + 1);
                      } else {
                        setSelectedMonth(selectedMonth + 1);
                      }
                    }}
                    className="p-1"
                  >
                    <ChevronRight 
                      size={20} 
                      color={isDarkMode ? '#FFFFFF' : '#000000'} 
                    />
                  </TouchableOpacity>
                </View>
                
                <View className="flex-row items-center border rounded-[20px] p-2 flex-1 justify-between border-[#DDDDDD]">
                  <TouchableOpacity
                    onPress={() => setSelectedYear(selectedYear - 1)}
                    className="p-1"
                  >
                    <ChevronLeft 
                      size={20} 
                      color={isDarkMode ? '#FFFFFF' : '#000000'} 
                    />
                  </TouchableOpacity>
                  <Text 
                    style={fontStyles('medium')}
                    className={`text-base ${isDarkMode ? 'text-white' : 'text-black'}`}
                  >
                    {selectedYear}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setSelectedYear(selectedYear + 1)}
                    className="p-1"
                  >
                    <ChevronRight 
                      size={20} 
                      color={isDarkMode ? '#FFFFFF' : '#000000'} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Recurring Budget Option - Only show when not editing */}
            {!editBudget && (
              <View className="mb-5">
                <View className="flex-row justify-between items-center mb-2">
                  <Text 
                    style={fontStyles('medium')}
                    className={`text-base ${isDarkMode ? 'text-white' : 'text-black'}`}
                  >
                    Recurring Budget
                  </Text>
                  <Switch
                    value={isRecurring}
                    onValueChange={setIsRecurring}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={isRecurring ? '#0ea5e9' : '#f4f3f4'}
                  />
                </View>
                {isRecurring && (
                  <Text 
                    style={fontStyles('regular')}
                    className={`text-xs italic ${isDarkMode ? 'text-[#B0B0B0]' : 'text-[#707070]'}`}
                  >
                    This budget will be created for {getMonthName(selectedMonth)} through December {selectedYear}
                  </Text>
                )}
              </View>
            )}

            {/* Save Button */}
            <TouchableOpacity
              className="bg-[#0ea5e9] p-4 rounded-[20px] items-center mt-2.5 mb-5"
              onPress={handleSave}
            >
              <Text 
                style={fontStyles('semibold')}
                className="text-white text-base"
              >
                {editBudget ? 'Update Budget' : 'Create Budget'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default BudgetForm; 