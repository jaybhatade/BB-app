import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import CategorySelection from './CategorySelection';
import fontStyles from '../utils/fontStyles';

interface CategorySelectionTriggerProps {
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
  categoryType?: 'expense' | 'income' | 'all';
  buttonLabel?: string;
  getCategoryById: (id: string) => any;
}

const CategorySelectionTrigger: React.FC<CategorySelectionTriggerProps> = ({
  selectedCategory,
  onCategorySelect,
  categoryType = 'all',
  buttonLabel = 'Select Category',
  getCategoryById
}) => {
  const { isDarkMode } = useTheme();
  const [showCategorySelection, setShowCategorySelection] = useState<boolean>(false);
  
  const handleCategorySelect = (categoryId: string) => {
    onCategorySelect(categoryId);
    setShowCategorySelection(false);
  };

  return (
    <View>
      <TouchableOpacity
        className={`border rounded-[20px] p-3 flex-row justify-between items-center ${
          isDarkMode 
            ? 'bg-[#334155] border-[#475569]' 
            : 'bg-[#F5F5F5] border-[#DDDDDD]'
        }`}
        onPress={() => setShowCategorySelection(true)}
      >
        {selectedCategory ? (
          <View className="flex-row items-center">
            <View 
              className="w-[30px] h-[30px] rounded-[15px] justify-center items-center"
              style={{ 
                borderColor: getCategoryById(selectedCategory)?.color || '#0ea5e9',
                borderWidth: 2
              }}
            >
              <Text className="text-white">
                {getCategoryById(selectedCategory)?.icon || '📦'}
              </Text>
            </View>
            <Text 
              style={fontStyles('medium')}
              className={`ml-2.5 ${isDarkMode ? 'text-white' : 'text-black'}`}
            >
              {getCategoryById(selectedCategory)?.name || buttonLabel}
            </Text>
          </View>
        ) : (
          <Text 
            style={fontStyles('regular')}
            className={isDarkMode ? 'text-[#B0B0B0]' : 'text-[#707070]'}
          >
            {buttonLabel}
          </Text>
        )}
      </TouchableOpacity>

      {/* Full-page Category Selection Modal */}
      <Modal
        visible={showCategorySelection}
        animationType="slide"
        onRequestClose={() => setShowCategorySelection(false)}
      >
        <CategorySelection
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategorySelect}
          categoryType={categoryType}
          headerTitle={`Select ${categoryType === 'expense' ? 'Expense' : categoryType === 'income' ? 'Income' : ''} Category`}
          onClose={() => setShowCategorySelection(false)}
        />
      </Modal>
    </View>
  );
};

export default CategorySelectionTrigger; 