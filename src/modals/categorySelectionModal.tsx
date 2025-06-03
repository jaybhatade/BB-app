import React, { useState, useEffect } from 'react';
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

const CategorySelectionModal = ({ 
  categories, 
  categoryId, 
  setCategoryId, 
  setShowCategoryModal,
  subcategoryId,
  setSubcategoryId
}) => {
  const { isDarkMode } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState(categoryId);
  const [showSubcategories, setShowSubcategories] = useState(false);
  const [currentSubcategories, setCurrentSubcategories] = useState([]);
  const [selectedParentCategory, setSelectedParentCategory] = useState(null);

  // Get subcategories for a category if available
  const getSubcategories = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category && category.subcategories ? category.subcategories : [];
  };

  useEffect(() => {
    if (selectedCategory) {
      const subs = getSubcategories(selectedCategory);
      setCurrentSubcategories(subs);
    }
  }, [selectedCategory]);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category.id);
    
    // Check if category has subcategories
    const subs = category.subcategories || [];
    
    if (subs && subs.length > 0) {
      setCurrentSubcategories(subs);
      setSelectedParentCategory(category);
      setShowSubcategories(true);
    } else {
      // No subcategories, just select the category
      setCategoryId(category.id);
      setSubcategoryId && setSubcategoryId(null);
      setShowCategoryModal(false);
    }
  };

  const handleSubcategorySelect = (subcategory) => {
    setCategoryId(selectedParentCategory.id);
    setSubcategoryId && setSubcategoryId(subcategory.id);
    setShowCategoryModal(false);
  };

  const handleBackToCategories = () => {
    setShowSubcategories(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.modalContainer}
    >
      <View className={`rounded-tl-2xl rounded-tr-2xl p-5 max-h-[80%] min-h-[50%] ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
            {showSubcategories ? 'Select Subcategory' : 'Select Category'}
          </Text>
          {showSubcategories && (
            <TouchableOpacity onPress={handleBackToCategories} style={styles.backButton}>
              <Text style={{ color: isDarkMode ? '#FFFFFF' : '#000000' }}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
            <X size={24} color={isDarkMode ? '#FFFFFF' : '#000000'} />
          </TouchableOpacity>
        </View>

        {!showSubcategories ? (
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.categoryItem, { borderBottomColor: isDarkMode ? '#2E2E2E' : '#F0F0F0' }]}
                onPress={() => handleCategorySelect(item)}
              >
                <View style={[styles.iconContainer, { borderColor: item.color, borderWidth: 2 }]}>
                  <Text style={{ fontSize: 20, color: item.color }}>{item.icon}</Text>
                </View>
                <Text style={[styles.categoryName, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>{item.name}</Text>
                {categoryId === item.id && !subcategoryId && (
                  <View style={styles.selectedIndicator}>
                    <CheckCircle size={24} color="#21965B" />
                  </View>
                )}
                {item.subcategories && item.subcategories.length > 0 && (
                  <Text style={styles.subcategoryIndicator}>›</Text>
                )}
              </TouchableOpacity>
            )}
          />
        ) : (
          <FlatList
            data={currentSubcategories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.categoryItem, { borderBottomColor: isDarkMode ? '#2E2E2E' : '#F0F0F0' }]}
                onPress={() => handleSubcategorySelect(item)}
              >
                <View style={[styles.iconContainer, { borderColor: item.color || selectedParentCategory.color, borderWidth: 2 }]}>
                  <Text style={{ fontSize: 20, color: item.color || selectedParentCategory.color }}>
                    {item.icon || selectedParentCategory.icon}
                  </Text>
                </View>
                <Text style={[styles.categoryName, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>{item.name}</Text>
                {subcategoryId === item.id && (
                  <View style={styles.selectedIndicator}>
                    <CheckCircle size={24} color="#21965B" />
                  </View>
                )}
              </TouchableOpacity>
            )}
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
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  categoryName: {
    fontSize: 16,
    flex: 1,
  },
  selectedIndicator: {
    marginLeft: 'auto',
  },
  subcategoryIndicator: {
    fontSize: 24,
    marginLeft: 8,
  },
  backButton: {
    marginRight: 'auto',
    marginLeft: 10,
  }
});

export default CategorySelectionModal;