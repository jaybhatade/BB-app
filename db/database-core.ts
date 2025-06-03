// database-core.ts
import * as SQLite from 'expo-sqlite';

// Open the database connection
export const db = SQLite.openDatabaseSync('bloom_budget.db');

// Add a table to track initialization status
export const INIT_TABLE_NAME = 'app_initialization';

// Core utility functions for database operations
export const getAllDataFromTable = async <T>(table: string): Promise<T[]> => {
  try {
    const result = await db.getAllAsync<T>(`SELECT * FROM ${table}`);
    return result;
  } catch (error) {
    console.error(`Error getting all data from ${table}:`, error);
    throw error;
  }
};

export const getUnsyncedData = async (table: string) => {
  try {
    const result = await db.getAllAsync(`SELECT * FROM ${table} WHERE synced = 0;`);
    return result;
  } catch (error) {
    console.error(`Error getting unsynced data from ${table}:`, error);
    throw error;
  }
};

export const markAsSynced = async (table: string, id: string) => {
  try {
    await db.runAsync(
      `UPDATE ${table} SET synced = 1 WHERE id = ?;`,
      [id]
    );
  } catch (error) {
    console.error(`Error marking ${table} as synced:`, error);
    throw error;
  }
};

// Clear database function
export const clearDatabase = async () => {
  try {
    // Clearing in reverse order of foreign key dependencies
    await db.execAsync(`
      DELETE FROM user_interests;
      DELETE FROM goals;
      DELETE FROM transactions;
      DELETE FROM budgets;
      DELETE FROM subscriptions;
      DELETE FROM categories;
      DELETE FROM accounts;
      DELETE FROM users;
      DELETE FROM ${INIT_TABLE_NAME};
    `);
    console.log('Database cleared successfully');
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  }
};

export default db;