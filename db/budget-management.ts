// budget-management.ts
import { db } from './database-core';
import { Budget, BudgetWithSpending } from './types';

// Add a new budget
export const addBudget = async (budget: Budget) => {
  try {
    await db.runAsync(
      `INSERT INTO budgets (id, userId, categoryId, budgetLimit, month, year, createdAt, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        budget.id,
        budget.userId,
        budget.categoryId,
        budget.budgetLimit,
        budget.month,
        budget.year,
        budget.createdAt,
        0
      ]
    );
  } catch (error) {
    console.error('Error adding budget:', error);
    throw error;
  }
};

// Update an existing budget
export const updateBudget = async (budget: Budget) => {
  try {
    await db.runAsync(
      `UPDATE budgets 
       SET categoryId = ?, budgetLimit = ?, month = ?, year = ?, synced = 0
       WHERE id = ? AND userId = ?`,
      [
        budget.categoryId,
        budget.budgetLimit,
        budget.month,
        budget.year,
        budget.id,
        budget.userId
      ]
    );
  } catch (error) {
    console.error('Error updating budget:', error);
    throw error;
  }
};

// Delete a budget
export const deleteBudget = async (budgetId: string, userId: string) => {
  try {
    await db.runAsync(
      `DELETE FROM budgets WHERE id = ? AND userId = ?`,
      [budgetId, userId]
    );
  } catch (error) {
    console.error('Error deleting budget:', error);
    throw error;
  }
};

// Get all budgets for a user
export const getBudgetsByUserId = async (userId: string): Promise<Budget[]> => {
  try {
    const budgets = await db.getAllAsync<Budget>(
      `SELECT * FROM budgets WHERE userId = ?`,
      [userId]
    );
    return budgets;
  } catch (error) {
    console.error('Error getting budgets:', error);
    throw error;
  }
};

// Get a specific budget by ID
export const getBudgetById = async (budgetId: string): Promise<Budget | null> => {
  try {
    const budget = await db.getFirstAsync<Budget>(
      `SELECT * FROM budgets WHERE id = ?`,
      [budgetId]
    );
    return budget;
  } catch (error) {
    console.error('Error getting budget:', error);
    throw error;
  }
};

// Calculate spending for a specific budget category and time period
export const getBudgetSpending = async (categoryId: string, month: number, year: number): Promise<number> => {
  try {
    // Calculate the first and last day of the month
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
    
    const result = await db.getFirstAsync<{ totalSpent: number }>(
      `SELECT SUM(amount) as totalSpent FROM transactions 
       WHERE categoryId = ? AND date BETWEEN ? AND ? AND type = 'expense'`,
      [categoryId, startDate, endDate]
    );
    return result?.totalSpent || 0;
  } catch (error) {
    console.error('Error calculating budget spending:', error);
    throw error;
  }
};

// Get budgets with spending calculations
export const getBudgetsWithSpending = async (userId: string): Promise<BudgetWithSpending[]> => {
  try {
    const budgets = await getBudgetsByUserId(userId);
    
    const budgetsWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        const spent = await getBudgetSpending(
          budget.categoryId, 
          budget.month, 
          budget.year
        );
        
        return {
          ...budget,
          spent,
          remaining: budget.budgetLimit - spent,
          percentUsed: (spent / budget.budgetLimit) * 100
        };
      })
    );
    
    return budgetsWithSpending;
  } catch (error) {
    console.error('Error getting budgets with spending:', error);
    throw error;
  }
};

// Get all budgets for analytics
export const getAllBudgets = async (): Promise<Budget[]> => {
  try {
    const budgets = await db.getAllAsync<Budget>(`SELECT * FROM budgets`);
    return budgets;
  } catch (error) {
    console.error('Error getting all budgets:', error);
    throw error;
  }
};

// Get monthly spending by category
export const getMonthlyCategorySpending = async (userId: string, month: number, year: number) => {
  try {
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
    
    const result = await db.getAllAsync<{ categoryId: string, totalSpent: number }>(
      `SELECT categoryId, SUM(amount) as totalSpent 
       FROM transactions 
       WHERE userId = ? AND date BETWEEN ? AND ? AND type = 'expense'
       GROUP BY categoryId`,
      [userId, startDate, endDate]
    );
    
    return result;
  } catch (error) {
    console.error('Error getting monthly category spending:', error);
    throw error;
  }
};

// Get budget trends over time for a specific category
export const getBudgetTrends = async (userId: string, categoryId: string, monthsBack: number = 6) => {
  try {
    const currentDate = new Date();
    const trends = [];
    
    for (let i = 0; i < monthsBack; i++) {
      const targetMonth = currentDate.getMonth() - i;
      const targetYear = currentDate.getFullYear() + Math.floor(targetMonth / 12);
      const normalizedMonth = ((targetMonth % 12) + 12) % 12; // Handle negative months
      
      // Get budget for this month if it exists
      const budget = await db.getFirstAsync<Budget>(
        `SELECT * FROM budgets 
         WHERE userId = ? AND categoryId = ? AND month = ? AND year = ?`,
        [userId, categoryId, normalizedMonth, targetYear]
      );
      
      // Get actual spending for this month
      const spent = await getBudgetSpending(categoryId, normalizedMonth, targetYear);
      
      trends.push({
        month: normalizedMonth,
        year: targetYear,
        budgetLimit: budget?.budgetLimit || 0,
        spent: spent
      });
    }
    
    return trends.reverse(); // Return with most recent month last
  } catch (error) {
    console.error('Error getting budget trends:', error);
    throw error;
  }
};