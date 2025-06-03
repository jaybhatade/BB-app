import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import * as CategoryManager from '../../db/category-management';
import { 
  Smile,
  Plus, 
  Trash, 
  FolderOpen, 
  Pencil
} from 'lucide-react-native';
import EmojiPicker from 'rn-emoji-keyboard';
import fontStyles from '../utils/fontStyles';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Category } from '../../db/types';

// Function to check if a string is a single emoji
const isSingleEmoji = (str: string): boolean => {
  const emojiRegex = /^[\p{Emoji}]$/u;
  return emojiRegex.test(str);
};

// Function to check if a string contains only text and numbers
const isTextAndNumbersOnly = (str: string): boolean => {
  return /^[a-zA-Z0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/.test(str);
};

// Predefined set of colors
const AVAILABLE_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#2ECC71', // Emerald
  '#3498DB', // Ocean Blue
  '#9B59B6', // Purple
  '#E67E22', // Orange
  '#1ABC9C', // Turquoise
  '#34495E', // Dark Blue
  '#F1C40F', // Yellow
  '#E74C3C', // Dark Red
];

// Function to get the next available color
const getNextAvailableColor = (existingCategories: Category[]): string => {
  const usedColors = new Set(existingCategories.map(cat => cat.color));
  const availableColor = AVAILABLE_COLORS.find(color => !usedColors.has(color));
  return availableColor || AVAILABLE_COLORS[0]; // Fallback to first color if all are used
};

export default function ManageCategoriesScreen() {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const userId = user?.uid || '';
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isEmojiPickerVisible, setIsEmojiPickerVisible] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    icon: '',
    color: '#FF6B6B',
    description: '',
  });

  const loadCategories = useCallback(async () => {
    try {
      const result = await CategoryManager.getCategories(userId);
      setCategories(result);
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    }
  }, [userId]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleNameChange = (text: string) => {
    if (isTextAndNumbersOnly(text)) {
      setFormData(prev => ({ ...prev, name: text }));
    }
  };

  const handleEmojiSelect = useCallback((emoji: { emoji: string }) => {
    setFormData(prev => ({ ...prev, icon: emoji.emoji }));
  }, []);

  const handleAddCategory = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }
    if (!formData.icon.trim()) {
      Alert.alert('Error', 'Please enter an emoji icon');
      return;
    }

    try {
      const id = `cat_${Date.now()}`;
      const newCategory: Category = {
        id,
        userId,
        name: formData.name,
        type: formData.type,
        icon: formData.icon,
        color: getNextAvailableColor(categories),
        description: formData.description.trim() || undefined,
        createdAt: new Date().toISOString(),
        synced: 0
      };
      
      await CategoryManager.addCategory(newCategory);
      await loadCategories();
      closeModal();
    } catch (error) {
      console.error('Error adding category:', error);
      Alert.alert('Error', 'Failed to add category');
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory) return;

    try {
      const updatedCategory: Category = {
        ...editingCategory,
        name: formData.name,
        type: formData.type,
        icon: formData.icon,
        color: formData.color,
        description: formData.description.trim() || undefined
      };
      
      await CategoryManager.updateCategory(updatedCategory);
      await loadCategories();
      closeModal();
    } catch (error) {
      console.error('Error updating category:', error);
      Alert.alert('Error', 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    Alert.alert(
      'Delete Category',
      'Are you sure you want to delete this category?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await CategoryManager.deleteCategory(id, userId);
              await loadCategories();
            } catch (error) {
              console.error('Error deleting category:', error);
              Alert.alert('Error', 'Failed to delete category');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'expense',
      icon: '',
      color: '#FF6B6B',
      description: '',
    });
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      icon: category.icon,
      color: category.color,
      description: category.description || '',
    });
    setIsModalVisible(true);
  };

  const openAddModal = () => {
    setEditingCategory(null);
    resetForm();
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setEditingCategory(null);
    resetForm();
  };

  const renderItem = ({ item }: { item: Category }) => (
    <View className="mb-3">
      <View className={`p-4 rounded-[20px] mb-0 flex-row items-center justify-between ${
        isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
      }`} key={item.id}>
        <TouchableOpacity
          className="flex-row items-center flex-1"
          onPress={() => openEditModal(item)}
        >
          <View 
            className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
            style={{ borderColor: item.color, borderWidth: 2 }}
          >
            <Text style={fontStyles('extrabold')} className="text-2xl">{item.icon}</Text>
          </View>
          <View className="flex-1">
            <Text style={fontStyles('extrabold')} className={`font-montserrat-medium text-lg ${
              isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
            }`}>
              {item.name}
            </Text>
            <Text style={fontStyles('extrabold')} className={`font-montserrat text-sm ${
              isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
            }`}>
              {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            </Text>
            {item.description && (
              <Text style={fontStyles('extrabold')} className={`font-montserrat text-sm mt-1 ${
                isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
              }`}>
                {item.description}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const EmptyListComponent = () => (
    <View className="flex-1 items-center justify-center">
      <FolderOpen
        size={80}
        color={isDarkMode ? '#666666' : '#999999'}
      />
      <Text style={fontStyles('extrabold')} className={`mt-4 text-lg font-montserrat-medium text-center ${
        isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
      }`}>
        No categories yet
      </Text>
      <Text style={fontStyles('extrabold')} className={`mt-2 text-sm font-montserrat text-center ${
        isDarkMode ? 'text-TextSecondaryDark' : 'text-TextSecondary'
      }`}>
        Add a category to get started
      </Text>
    </View>
  );

  return (
    <SafeAreaView className={`flex-1 ${isDarkMode ? 'bg-BackgroundDark' : 'bg-Background'}`} edges={['top']}>
      <View className="px-6 pb-6 flex-1">
        <FlatList
          data={categories}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={EmptyListComponent}
          contentContainerStyle={{ flexGrow: 1 }}
        />
      </View>

      <TouchableOpacity
        onPress={openAddModal}
        className={`rounded-full items-center justify-center ${
          isDarkMode ? 'bg-PrimaryDark' : 'bg-Primary'
        }`}
        style={{ 
          position: 'absolute',
          bottom: 50,
          right: 30,
          width: 56,
          height: 56,
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4
        }}
      >
        <Plus size={30} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Category Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          onPress={closeModal}
          className="flex-1 justify-end bg-black/50"
        >
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={e => e.stopPropagation()}
            className={`rounded-t-3xl ${
              isDarkMode ? 'bg-SurfaceDark' : 'bg-Surface'
            }`}
            style={{ maxHeight: '90%' }}
          >
            <ScrollView 
              showsVerticalScrollIndicator={false}
              className="px-8 py-8"
            >
              <Text style={fontStyles('extrabold')} className={`text-2xl font-montserrat-bold mb-8 ${
                isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
              }`}>
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </Text>

              <Text style={fontStyles('extrabold')} className={`font-montserrat-medium mb-4 text-lg ${
                isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
              }`}>
                Type
              </Text>
              <View className="flex-row justify-between mb-8">
                {['expense', 'income', 'transfer'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setFormData(prev => ({ ...prev, type }))}
                    className={`p-4 rounded-[24px] flex-1 mx-2 ${
                      formData.type === type
                        ? isDarkMode ? 'bg-PrimaryDark' : 'bg-Primary'
                        : isDarkMode ? 'bg-BackgroundDark' : 'bg-white'
                    }`}
                  >
                    <Text style={fontStyles('extrabold')} className={`font-montserrat-medium text-center text-base ${
                      formData.type === type
                        ? 'text-white'
                        : isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                    }`}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View className="flex-row items-center mb-8">
                <View 
                  className="w-20 h-20 rounded-[24px] items-center justify-center mr-6"
                  style={{ borderColor: formData.color, borderWidth: 2 }}
                >
                  <TextInput
                    className="text-4xl text-center p-0 m-0"
                    value={formData.icon}
                    placeholder="📚"
                    placeholderTextColor={isDarkMode ? '#B0B0B0' : '#707070'}
                    editable={false}
                  />
                  <TouchableOpacity 
                    className="absolute bottom-2 right-2 bg-transparent p-4"
                    onPress={() => setIsEmojiPickerVisible(true)}
                  >
                  </TouchableOpacity>
                </View>
                <View className="flex-1">
                  <TextInput
                    className={`p-5 rounded-[24px] text-lg ${
                      isDarkMode ? 'bg-BackgroundDark text-TextPrimaryDark' : 'bg-white text-TextPrimary'
                    }`}
                    placeholder="Category Name"
                    placeholderTextColor={isDarkMode ? '#B0B0B0' : '#707070'}
                    value={formData.name}
                    onChangeText={handleNameChange}
                  />
                </View>
              </View>


              <View className="mb-8">
                <TextInput
                  className={`p-5 rounded-[24px] text-base ${
                    isDarkMode ? 'bg-BackgroundDark text-TextPrimaryDark' : 'bg-white text-TextPrimary'
                  }`}
                  placeholder="Description (optional)"
                  placeholderTextColor={isDarkMode ? '#B0B0B0' : '#707070'}
                  value={formData.description}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
              <Text style={fontStyles('extrabold')} className={`font-montserrat-medium mb-4 text-sm ${
                isDarkMode ? 'text-gray-400/50' : 'text-gray-500/50'
              }`}>
                * Add custom emoji for the icon
              </Text>

              <View className="flex-row justify-between mb-6">
                <TouchableOpacity
                  onPress={closeModal}
                  className={`p-5 rounded-[24px] flex-1 mr-3 ${
                    isDarkMode ? 'bg-BackgroundDark' : 'bg-white'
                  }`}
                >
                  <Text style={fontStyles('extrabold')} className={`text-center font-montserrat-semibold text-base ${
                    isDarkMode ? 'text-TextPrimaryDark' : 'text-TextPrimary'
                  }`}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={editingCategory ? handleEditCategory : handleAddCategory}
                  className={`p-5 rounded-[24px] flex-1 ml-3 ${
                    isDarkMode ? 'bg-PrimaryDark' : 'bg-Primary'
                  }`}
                >
                  <Text style={fontStyles('extrabold')} className="text-white text-center font-montserrat-semibold text-base">
                    {editingCategory ? 'Update' : 'Add'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Delete Category Button */}
              {editingCategory && (
                <TouchableOpacity
                  onPress={() => handleDeleteCategory(editingCategory.id)}
                  className={`p-5 rounded-[24px] mt-6 ${
                    isDarkMode ? 'bg-red-700' : 'bg-red-500'
                  }`}
                >
                  <Text style={fontStyles('extrabold')} className="text-white text-center font-montserrat-semibold text-base">
                    Delete Category
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      <EmojiPicker
        onEmojiSelected={handleEmojiSelect}
        open={isEmojiPickerVisible}
        onClose={() => setIsEmojiPickerVisible(false)}
      />
    </SafeAreaView>
  );
}