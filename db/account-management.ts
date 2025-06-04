// account-management.ts
import { db } from './database-core';
import { Account } from './types';

// Add a new account
export const addAccount = async (account: Account) => {
  try {
    if (!account.userId) {
      throw new Error('User ID is required');
    }
    await db.runAsync(
      `INSERT INTO accounts (id, userId, name, balance, icon, createdAt, updatedAt, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        account.id,
        account.userId,
        account.name,
        account.balance,
        account.icon,
        account.createdAt,
        account.updatedAt,
        0
      ]
    );
    return true;
  } catch (error) {
    console.error('Error adding account:', error);
    throw new Error('Failed to add account. Please try again.');
  }
};

// Get all accounts for a user
export const getAccountsByUserId = async (userId: string): Promise<Account[]> => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    const accounts = await db.getAllAsync<Account>(
      `SELECT * FROM accounts WHERE userId = ? ORDER BY createdAt DESC`,
      [userId]
    );
    return accounts || [];
  } catch (error) {
    console.error('Error getting accounts:', error);
    throw new Error('Failed to load accounts. Please try again.');
  }
};

// Get a single account by ID
export const getAccountById = async (accountId: string): Promise<Account | null> => {
  try {
    if (!accountId) {
      throw new Error('Account ID is required');
    }
    const account = await db.getFirstAsync<Account>(
      `SELECT * FROM accounts WHERE id = ?`,
      [accountId]
    );
    return account || null;
  } catch (error) {
    console.error('Error getting account:', error);
    throw new Error('Failed to load account details. Please try again.');
  }
};

// Update an account
export const updateAccount = async (account: Account): Promise<boolean> => {
  try {
    if (!account.id || !account.userId) {
      throw new Error('Account ID and User ID are required');
    }
    await db.runAsync(
      `UPDATE accounts 
       SET name = ?, balance = ?, icon = ?, updatedAt = ?, synced = 0
       WHERE id = ? AND userId = ?`,
      [
        account.name,
        account.balance,
        account.icon,
        new Date().toISOString(),
        account.id,
        account.userId
      ]
    );
    return true;
  } catch (error) {
    console.error('Error updating account:', error);
    throw new Error('Failed to update account. Please try again.');
  }
};

// Delete an account
export const deleteAccount = async (accountId: string, userId: string): Promise<boolean> => {
  try {
    if (!accountId || !userId) {
      throw new Error('Account ID and User ID are required');
    }
    await db.runAsync(
      `DELETE FROM accounts WHERE id = ? AND userId = ?`,
      [accountId, userId]
    );
    return true;
  } catch (error) {
    console.error('Error deleting account:', error);
    throw new Error('Failed to delete account. Please try again.');
  }
};

// Get all accounts (for admin purposes)
export const getAllAccounts = async (): Promise<Account[]> => {
  try {
    const accounts = await db.getAllAsync<Account>(`SELECT * FROM accounts ORDER BY createdAt DESC`);
    return accounts || [];
  } catch (error) {
    console.error('Error getting all accounts:', error);
    throw new Error('Failed to load accounts. Please try again.');
  }
};