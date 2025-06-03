// account-management.ts
import { db } from './database-core';
import { Account } from './types';

// Add a new account
export const addAccount = async (account: Account) => {
  try {
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
  } catch (error) {
    console.error('Error adding account:', error);
    throw error;
  }
};

// Get all accounts for a user
export const getAccounts = async (userId: string) => {
  try {
    const accounts = await db.getAllAsync<Account>(
      `SELECT * FROM accounts WHERE userId = ?`,
      [userId]
    );
    return accounts;
  } catch (error) {
    console.error('Error getting accounts:', error);
    throw error;
  }
};

// Get a single account by ID
export const getAccountById = async (accountId: string) => {
  try {
    const account = await db.getFirstAsync<Account>(
      `SELECT * FROM accounts WHERE id = ?`,
      [accountId]
    );
    return account;
  } catch (error) {
    console.error('Error getting account:', error);
    throw error;
  }
};

// Update an account
export const updateAccount = async (account: Account) => {
  try {
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
  } catch (error) {
    console.error('Error updating account:', error);
    throw error;
  }
};

// Delete an account
export const deleteAccount = async (accountId: string, userId: string) => {
  try {
    await db.runAsync(
      `DELETE FROM accounts WHERE id = ? AND userId = ?`,
      [accountId, userId]
    );
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
};

// Get all accounts
export const getAllAccounts = async (): Promise<Account[]> => {
  try {
    const accounts = await db.getAllAsync<Account>(`SELECT * FROM accounts`);
    return accounts;
  } catch (error) {
    console.error('Error getting all accounts:', error);
    throw error;
  }
};