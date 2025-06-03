import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList,
  SafeAreaView,
  StatusBar,
  TextInput
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import * as db from '../../db/dbUtils';
import { Search, X, ArrowLeft, Check } from 'lucide-react-native';
import fontStyles from '../utils/fontStyles';

interface CategorySelectionProps {
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
  categoryType?: 'expense' | 'income' | 'all';
  headerTitle?: string;
  onClose: () => void;
}

const CategorySelection: React.FC<CategorySelectionProps> = ({
  selectedCategory,
  onCategorySelect,
  categoryType = 'all',
  headerTitle = 'Select Category',
  onClose,
}) => {
  const { isDarkMode } = useTheme();
  const [categories, setCategories] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredCategories, setFilteredCategories] = useState<any[]>([]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const allCategories = await db.getAllCategories();
        // Filter categories by type if specified
        let typeFilteredCategories = allCategories;
        if (categoryType !== 'all') {
          typeFilteredCategories = allCategories.filter(cat => cat.type === categoryType);
        }
        setCategories(typeFilteredCategories);
        setFilteredCategories(typeFilteredCategories);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };

    loadCategories();
  }, [categoryType]);

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const filtered = categories.filter(cat => 
        cat.name.toLowerCase().includes(lowerCaseQuery)
      );
      setFilteredCategories(filtered);
    }
  }, [searchQuery, categories]);

  return (
    <SafeAreaView className={`flex-1 ${isDarkMode ? 'bg-[#1E293B]' : 'bg-white'}`}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-black/10">
        <TouchableOpacity 
          className="p-2" 
          onPress={onClose}
        >
          <ArrowLeft 
            size={24} 
            color={isDarkMode ? '#FFFFFF' : '#000000'} 
          />
        </TouchableOpacity>
        <Text 
          style={fontStyles('bold')}
          className={`text-lg ${isDarkMode ? 'text-white' : 'text-black'}`}
        >
          {headerTitle}
        </Text>
        <View className="w-10" />
      </View>
      
      {/* Search Bar */}
      <View className={`mx-4 my-6 px-3 py-2.5 rounded-[20px] flex-row items-center ${
        isDarkMode ? 'bg-[#334155]' : 'bg-[#F5F5F5]'
      }`}>
        <Search 
          size={20} 
          color={isDarkMode ? '#B0B0B0' : '#707070'} 
          className="mr-2"
        />
        <TextInput 
          className={`flex-1 h-10 text-base ${isDarkMode ? 'text-white' : 'text-black'}`}
          placeholder="Search categories"
          placeholderTextColor={isDarkMode ? '#B0B0B0' : '#707070'}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery !== '' && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X 
              size={20} 
              color={isDarkMode ? '#B0B0B0' : '#707070'} 
            />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Categories List */}
      <FlatList
        data={filteredCategories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            className={`flex-row items-center p-4 ${
              selectedCategory === item.id 
                ? isDarkMode ? 'bg-[#334155]' : 'bg-[#E0E0E0]'
                : ''
            }`}
            onPress={() => {
              onCategorySelect(item.id);
              onClose();
            }}
          >
            <View 
              className="w-10 h-10 rounded-2xl justify-center items-center"
              style={{ borderColor: item.color, borderWidth: 2}}
            >
              <Text className="text-white">{item.icon}</Text>
            </View>
            <Text 
              style={fontStyles('medium')}
              className={`ml-2.5 text-lg ${isDarkMode ? 'text-white' : 'text-black'}`}
            >
              {item.name}
            </Text>
            {selectedCategory === item.id && (
              <Check 
                size={20} 
                color={isDarkMode ? '#FFFFFF' : '#0ea5e9'}
                className="ml-auto"
              />
            )}
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => (
          <View 
            className={`h-[1px] w-full ${
              isDarkMode ? 'bg-[#334155]' : 'bg-[#EEEEEE]'
            }`} 
          />
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={() => (
          <View className="p-5 items-center">
            <Text 
              style={fontStyles('regular')}
              className={`text-center mt-6 ${
                isDarkMode ? 'text-[#B0B0B0]' : 'text-[#707070]'
              }`}
            >
              No categories found
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default CategorySelection;