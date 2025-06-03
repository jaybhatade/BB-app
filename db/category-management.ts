// category-management.ts
import { db } from './database-core';
import { Category } from './types';

/**
 * Adds a new category to the database
 * @param category The category to add
 */
export const addCategory = async (category: Category) => {
  try {
    await db.runAsync(
      `INSERT INTO categories (id, userId, name, type, icon, color, description, createdAt, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        category.id,
        category.userId,
        category.name,
        category.type,
        category.icon,
        category.color,
        category.description || null,
        category.createdAt || new Date().toISOString()
      ]
    );
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
};

/**
 * Gets all categories for a specific user
 * @param userId The user ID
 * @returns An array of categories
 */
export const getCategories = async (userId: string): Promise<Category[]> => {
  try {
    const categories = await db.getAllAsync<Category>(
      `SELECT * FROM categories WHERE userId = ?`,
      [userId]
    );
    return categories;
  } catch (error) {
    console.error('Error getting categories:', error);
    throw error;
  }
};

/**
 * Gets a category by its ID
 * @param categoryId The category ID
 * @returns The category or undefined if not found
 */
export const getCategoryById = async (categoryId: string): Promise<Category | undefined> => {
  try {
    const category = await db.getFirstAsync<Category>(
      `SELECT * FROM categories WHERE id = ?`,
      [categoryId]
    );
    return category || undefined;
  } catch (error) {
    console.error('Error getting category by ID:', error);
    throw error;
  }
};

/**
 * Gets categories by type (income, expense, transfer)
 * @param type The category type
 * @param userId The user ID
 * @returns An array of categories of the specified type
 */
export const getCategoriesByType = async (type: string, userId: string): Promise<Category[]> => {
  try {
    const categories = await db.getAllAsync<Category>(
      `SELECT * FROM categories WHERE type = ? AND userId = ?`,
      [type, userId]
    );
    return categories;
  } catch (error) {
    console.error('Error getting categories by type:', error);
    throw error;
  }
};

/**
 * Updates an existing category
 * @param category The category with updated values
 */
export const updateCategory = async (category: Category) => {
  try {
    await db.runAsync(
      `UPDATE categories 
       SET name = ?, type = ?, icon = ?, color = ?, description = ?, synced = 0
       WHERE id = ? AND userId = ?`,
      [
        category.name,
        category.type,
        category.icon,
        category.color,
        category.description || null,
        category.id,
        category.userId
      ]
    );
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

/**
 * Deletes a category
 * @param categoryId The ID of the category to delete
 * @param userId The user ID for verification
 */
export const deleteCategory = async (categoryId: string, userId: string) => {
  try {
    await db.runAsync(
      `DELETE FROM categories WHERE id = ? AND userId = ?`,
      [categoryId, userId]
    );
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

/**
 * Gets all categories in the database
 * @returns An array of all categories
 */
export const getAllCategories = async (): Promise<Category[]> => {
  try {
    const categories = await db.getAllAsync<Category>(`SELECT * FROM categories`);
    return categories;
  } catch (error) {
    console.error('Error getting all categories:', error);
    throw error;
  }
};

/**
 * Moves all transactions from one category to another
 * @param fromCategoryId The source category ID
 * @param toCategoryId The destination category ID
 * @param userId The user ID for verification
 * @returns The number of transactions updated
 */
export const moveTransactionsBetweenCategories = async (
  fromCategoryId: string,
  toCategoryId: string,
  userId: string
): Promise<number> => {
  try {
    const result = await db.runAsync(
      `UPDATE transactions 
       SET categoryId = ?, synced = 0
       WHERE categoryId = ? AND userId = ?`,
      [toCategoryId, fromCategoryId, userId]
    );
    
    return result.changes;
  } catch (error) {
    console.error('Error moving transactions between categories:', error);
    throw error;
  }
};