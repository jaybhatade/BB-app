// transaction-management.ts
import { db } from './database-core';
import { Transaction } from './types';

/**
 * Adds a new transaction to the database
 * @param transaction The transaction to add
 */
export const addTransaction = async (transaction: Transaction) => {
  try {
    await db.runAsync(
      `INSERT INTO transactions (
        id, userId, type, title, categoryId, amount, accountId, date, notes, linkedTransactionId, synced
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        transaction.id,
        transaction.userId,
        transaction.type,
        transaction.title || "",
        transaction.categoryId,
        transaction.amount,
        transaction.accountId,
        transaction.date,
        transaction.notes || "",
        transaction.linkedTransactionId || null
      ]
    );
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
};

/**
 * Updates an existing transaction
 * @param transaction The transaction with updated values
 */
export const updateTransaction = async (transaction: Transaction) => {
  try {
    await db.runAsync(
      `UPDATE transactions 
       SET type = ?, title = ?, categoryId = ?, amount = ?, 
           accountId = ?, date = ?, notes = ?, linkedTransactionId = ?, synced = 0
       WHERE id = ? AND userId = ?`,
      [
        transaction.type,
        transaction.title || "",
        transaction.categoryId,
        transaction.amount,
        transaction.accountId,
        transaction.date,
        transaction.notes || "",
        transaction.linkedTransactionId || null,
        transaction.id,
        transaction.userId
      ]
    );
  } catch (error) {
    console.error('Error updating transaction:', error);
    throw error;
  }
};

/**
 * Gets all transactions for a specific user
 * @param userId The user ID
 * @returns An array of transactions
 */
export const getTransactionsByUserId = async (userId: string): Promise<Transaction[]> => {
  try {
    const transactions = await db.getAllAsync<Transaction>(
      `SELECT * FROM transactions WHERE userId = ? ORDER BY date DESC`,
      [userId]
    );
    return transactions;
  } catch (error) {
    console.error('Error getting transactions by user ID:', error);
    throw error;
  }
};

/**
 * Gets a transaction by its ID
 * @param transactionId The transaction ID
 * @returns The transaction or undefined if not found
 */
export const getTransactionById = async (transactionId: string): Promise<Transaction | undefined> => {
  try {
    const transaction = await db.getFirstAsync<Transaction>(
      `SELECT * FROM transactions WHERE id = ?`,
      [transactionId]
    );
    return transaction || undefined;
  } catch (error) {
    console.error('Error getting transaction by ID:', error);
    throw error;
  }
};

/**
 * Deletes a transaction
 * @param transactionId The ID of the transaction to delete
 */
export const deleteTransaction = async (transactionId: string) => {
  try {
    await db.runAsync(
      `DELETE FROM transactions WHERE id = ?`,
      [transactionId]
    );
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
      
  }
};

/**
 * Gets all transactions
 * @returns An array of all transactions
 */
export const getAllTransactions = async (): Promise<Transaction[]> => {
  try {
    const transactions = await db.getAllAsync<Transaction>(`SELECT * FROM transactions`);
    return transactions;
  } catch (error) {
    console.error('Error getting all transactions:', error);
    throw error;
  }
};

/**
 * Gets transactions by category ID
 * @param categoryId The category ID
 * @returns An array of transactions for the specified category
 */
export const getTransactionsByCategoryId = async (categoryId: string): Promise<Transaction[]> => {
  try {
    const transactions = await db.getAllAsync<Transaction>(
      `SELECT * FROM transactions WHERE categoryId = ? ORDER BY date DESC`,
      [categoryId]
    );
    return transactions;
  } catch (error) {
    console.error('Error getting transactions by category ID:', error);
    throw error;
  }
};

/**
 * Gets transactions by account ID
 * @param accountId The account ID
 * @returns An array of transactions for the specified account
 */
export const getTransactionsByAccountId = async (accountId: string): Promise<Transaction[]> => {
  try {
    const transactions = await db.getAllAsync<Transaction>(
      `SELECT * FROM transactions WHERE accountId = ? ORDER BY date DESC`,
      [accountId]
    );
    return transactions;
  } catch (error) {
    console.error('Error getting transactions by account ID:', error);
    throw error;
  }
};

/**
 * Gets transactions by date range
 * @param startDate Starting date in ISO format (YYYY-MM-DD)
 * @param endDate Ending date in ISO format (YYYY-MM-DD)
 * @param userId Optional user ID to filter by
 * @returns An array of transactions within the date range
 */
export const getTransactionsByDateRange = async (
  startDate: string,
  endDate: string,
  userId?: string
): Promise<Transaction[]> => {
  try {
    let query = `SELECT * FROM transactions WHERE date BETWEEN ? AND ? `;
    const params: any[] = [startDate, endDate];
    
    if (userId) {
      query += 'AND userId = ? ';
      params.push(userId);
    }
    
    query += 'ORDER BY date DESC';
    
    const transactions = await db.getAllAsync<Transaction>(query, params);
    return transactions;
  } catch (error) {
    console.error('Error getting transactions by date range:', error);
    throw error;
  }
};

/**
 * Gets transactions by type (income, expense, transfer)
 * @param type The transaction type
 * @param userId Optional user ID to filter by
 * @returns An array of transactions of the specified type
 */
export const getTransactionsByType = async (
  type: string,
  userId?: string
): Promise<Transaction[]> => {
  try {
    let query = `SELECT * FROM transactions WHERE type = ? `;
    const params: any[] = [type];
    
    if (userId) {
      query += 'AND userId = ? ';
      params.push(userId);
    }
    
    query += 'ORDER BY date DESC';
    
    const transactions = await db.getAllAsync<Transaction>(query, params);
    return transactions;
  } catch (error) {
    console.error('Error getting transactions by type:', error);
    throw error;
  }
};

/**
 * Gets linked transactions
 * @param transactionId The parent transaction ID
 * @returns An array of linked transactions
 */
export const getLinkedTransactions = async (transactionId: string): Promise<Transaction[]> => {
  try {
    const transactions = await db.getAllAsync<Transaction>(
      `SELECT * FROM transactions WHERE linkedTransactionId = ? OR id = ?`,
      [transactionId, transactionId]
    );
    return transactions;
  } catch (error) {
    console.error('Error getting linked transactions:', error);
    throw error;
  }
};

/**
 * Gets sum of amounts by category and date range
 * @param startDate Starting date in ISO format (YYYY-MM-DD)
 * @param endDate Ending date in ISO format (YYYY-MM-DD)
 * @param userId Optional user ID to filter by
 * @returns An array of categories with their total amounts
 */
export const getCategoryTotals = async (
  startDate: string,
  endDate: string,
  userId?: string
): Promise<{ categoryId: string, total: number }[]> => {
  try {
    let query = `
      SELECT categoryId, SUM(amount) as total
      FROM transactions 
      WHERE date BETWEEN ? AND ? `;
    const params: any[] = [startDate, endDate];
    
    if (userId) {
      query += 'AND userId = ? ';
      params.push(userId);
    }
    
    query += 'GROUP BY categoryId';
    
    const results = await db.getAllAsync<{ categoryId: string, total: number }>(query, params);
    return results;
  } catch (error) {
    console.error('Error getting category totals:', error);
    throw error;
  }
};

/**
 * Gets the total income, expense, and balance for a date range
 * @param startDate Starting date in ISO format (YYYY-MM-DD)
 * @param endDate Ending date in ISO format (YYYY-MM-DD)
 * @param userId Optional user ID to filter by
 * @returns Summary of totals by transaction type
 */
export const getTransactionSummary = async (
  startDate: string,
  endDate: string,
  userId?: string
): Promise<{ income: number, expense: number, balance: number }> => {
  try {
    let query = `
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
      FROM transactions 
      WHERE date BETWEEN ? AND ? `;
    const params: any[] = [startDate, endDate];
    
    if (userId) {
      query += 'AND userId = ? ';
      params.push(userId);
    }
    
    const result = await db.getFirstAsync<{ income: number, expense: number }>(query, params);
    
    const income = result?.income || 0;
    const expense = result?.expense || 0;
    const balance = income - expense;
    
    return { income, expense, balance };
  } catch (error) {
    console.error('Error getting transaction summary:', error);
    throw error;
  }
};