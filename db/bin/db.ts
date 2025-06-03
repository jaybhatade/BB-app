import * as SQLite from 'expo-sqlite';

// User interface with added fields
interface User {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  avatar?: string;           // New field
  dateOfBirth?: string;      // New field
  occupation?: string;       // New field
  createdAt: string;
  updatedAt: string;
  synced: number;
}

// New interface for user interests
interface UserInterest {
  id: string;
  userId: string;
  interest: string;
  synced: number;
}

interface Transaction {
  id: string;
  userId: string;
  type: string;
  categoryId: string;
  subCategoryId?: string;    // New field
  amount: number;
  accountId: string;
  date: string;
  notes?: string;
  linkedTransactionId?: string;
  synced: number;
}

interface Account {
  id: string;
  userId: string;
  name: string;
  balance: number;
  icon: string;
  createdAt: string;
  updatedAt: string;
  synced: number;
}

interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  budgetLimit: number;
  month: number; // 0-11 for January-December
  year: number;
  createdAt: string;
  synced: number;
}

interface Subscription {
  id: string;
  userId: string;
  name: string;
  amount: number;
  categoryId: string;
  status: string;
  renewalDate: string;
  createdAt: string;
  synced: number;
}

interface Category {
  id: string;
  userId: string;
  name: string;
  type: string;
  icon: string;
  color: string;
  createdAt: string;
  synced: number;
}

// New interface for subcategories
interface Subcategory {
  id: string;
  userId: string;
  name: string;
  type: string;
  color: string;
  parentCategoryId: string;
  createdAt: string;
  synced: number;
}

interface Goal {
  id: string;
  userId: string;
  title: string;
  emoji: string;
  targetAmount: number;
  targetDate: string;
  accountId: string;
  includeBalance: boolean;
  monthlyContribution: number;
  createdAt: string;
  synced: number;
}

const db = SQLite.openDatabaseSync('bloom_budget.db');

// Add a table to track initialization status
const INIT_TABLE_NAME = 'app_initialization';

export const setupDatabase = async (userId: string) => {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS ${INIT_TABLE_NAME} (
        initialized INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT,
        firstName TEXT,
        lastName TEXT,
        phoneNumber TEXT,
        avatar TEXT,
        dateOfBirth TEXT,
        occupation TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        synced INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS user_interests (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT,
        interest TEXT,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT,
        name TEXT,
        type TEXT,
        icon TEXT,
        color TEXT,
        createdAt TEXT,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS subcategories (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT,
        name TEXT,
        type TEXT,
        color TEXT,
        parentCategoryId TEXT,
        createdAt TEXT,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (parentCategoryId) REFERENCES categories (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT,
        type TEXT,
        categoryId TEXT,
        subCategoryId TEXT,
        amount REAL,
        accountId TEXT,
        date TEXT,
        notes TEXT,
        linkedTransactionId TEXT,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (categoryId) REFERENCES categories (id) ON DELETE SET NULL,
        FOREIGN KEY (subCategoryId) REFERENCES subcategories (id) ON DELETE SET NULL,
        FOREIGN KEY (accountId) REFERENCES accounts (id) ON DELETE CASCADE,
        FOREIGN KEY (linkedTransactionId) REFERENCES transactions (id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT,
        name TEXT,
        balance REAL,
        icon TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT,
        categoryId TEXT,
        budgetLimit REAL,
        month INTEGER,
        year INTEGER,
        createdAt TEXT,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (categoryId) REFERENCES categories (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT,
        name TEXT,
        amount REAL,
        categoryId TEXT,
        status TEXT,
        renewalDate TEXT,
        createdAt TEXT,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (categoryId) REFERENCES categories (id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT,
        title TEXT,
        emoji TEXT,
        targetAmount REAL,
        targetDate TEXT,
        accountId TEXT,
        includeBalance INTEGER,
        monthlyContribution REAL,
        createdAt TEXT,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (accountId) REFERENCES accounts (id) ON DELETE CASCADE
      );
    `);

    // Ensure all database schema migrations are applied
    await migrateDatabase();

    // Check if initialization has already been done
    const result = await db.getFirstAsync<{ initialized: number }>(
      `SELECT initialized FROM ${INIT_TABLE_NAME} LIMIT 1;`
    );

    if (!result || result.initialized === 0) {
      // Insert default categories and accounts
      await insertDefaultData(userId);
      
      // Mark initialization as complete
      await db.runAsync(
        `INSERT INTO ${INIT_TABLE_NAME} (initialized) VALUES (1);`
      );
    }
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  }
};

// Function to handle database migrations
const migrateDatabase = async () => {
  try {
    // Check if we need to add new columns to the users table
    const userColumns = await db.getAllAsync("PRAGMA table_info(users);");
    
    const avatarExists = userColumns.some((column: any) => column.name === 'avatar');
    const dateOfBirthExists = userColumns.some((column: any) => column.name === 'dateOfBirth');
    const occupationExists = userColumns.some((column: any) => column.name === 'occupation');
    
    // Add the new columns if they don't exist
    if (!avatarExists) {
      console.log('Adding avatar column to users table');
      await db.execAsync("ALTER TABLE users ADD COLUMN avatar TEXT;");
    }
    
    if (!dateOfBirthExists) {
      console.log('Adding dateOfBirth column to users table');
      await db.execAsync("ALTER TABLE users ADD COLUMN dateOfBirth TEXT;");
    }
    
    if (!occupationExists) {
      console.log('Adding occupation column to users table');
      await db.execAsync("ALTER TABLE users ADD COLUMN occupation TEXT;");
    }
    
    // Check if user_interests table exists
    const tablesResult = await db.getAllAsync("SELECT name FROM sqlite_master WHERE type='table';");
    const tableNames = tablesResult.map((t: any) => t.name);
    
    if (!tableNames.includes('user_interests')) {
      console.log('Creating user_interests table');
      await db.execAsync(`
        CREATE TABLE user_interests (
          id TEXT PRIMARY KEY NOT NULL,
          userId TEXT,
          interest TEXT,
          synced INTEGER DEFAULT 0,
          FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
        );
      `);
    }
    
    // Check if subcategories table exists
    if (!tableNames.includes('subcategories')) {
      console.log('Creating subcategories table');
      await db.execAsync(`
        CREATE TABLE subcategories (
          id TEXT PRIMARY KEY NOT NULL,
          userId TEXT,
          name TEXT,
          type TEXT,
          color TEXT,
          parentCategoryId TEXT,
          createdAt TEXT,
          synced INTEGER DEFAULT 0,
          FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
          FOREIGN KEY (parentCategoryId) REFERENCES categories (id) ON DELETE CASCADE
        );
      `);
    }
    
    // Check if transactions table has the subCategoryId column
    const transactionColumns = await db.getAllAsync("PRAGMA table_info(transactions);");
    const subCategoryIdExists = transactionColumns.some((column: any) => column.name === 'subCategoryId');
    
    if (!subCategoryIdExists) {
      console.log('Adding subCategoryId column to transactions table');
      await db.execAsync("ALTER TABLE transactions ADD COLUMN subCategoryId TEXT REFERENCES subcategories(id);");
    }

    // Check if budgetLimit column exists in budgets table
    const budgetColumns = await db.getAllAsync("PRAGMA table_info(budgets);");
    
    const budgetLimitExists = budgetColumns.some(
      (column: any) => column.name === 'budgetLimit'
    );
    
    // Add budgetLimit column if it doesn't exist
    if (!budgetLimitExists) {
      console.log('Adding budgetLimit column to budgets table');
      await db.execAsync(
        "ALTER TABLE budgets ADD COLUMN budgetLimit REAL DEFAULT 0;"
      );
    }
    
    // Check if we need to migrate the transactions table for linked transactions
    const linkedTransactionIdExists = transactionColumns.some(
      (column: any) => column.name === 'linkedTransactionId'
    );
    
    const transferFromExists = transactionColumns.some(
      (column: any) => column.name === 'transferFrom'
    );
    
    const transferToExists = transactionColumns.some(
      (column: any) => column.name === 'transferTo'
    );
    
    // Add linkedTransactionId if it doesn't exist
    if (!linkedTransactionIdExists) {
      console.log('Adding linkedTransactionId column to transactions table');
      await db.execAsync(
        "ALTER TABLE transactions ADD COLUMN linkedTransactionId TEXT;"
      );
      
      // If the old columns exist, migrate data from them
      if (transferFromExists && transferToExists) {
        console.log('Migrating transfer transactions data');
        
        // Get all transfer transactions
        const transferTransactions = await db.getAllAsync(`
          SELECT * FROM transactions
          WHERE type = 'transfer' AND (transferFrom IS NOT NULL OR transferTo IS NOT NULL)
        `);
        
        // For each transfer transaction, create a linked transaction with type credit
        for (const transaction of transferTransactions) {
          if (transaction.transferFrom && transaction.transferTo) {
            // Create a new transaction for the "to" account
            const creditTransactionId = `trans_credit_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
            
            // Insert credit transaction
            await db.runAsync(`
              INSERT INTO transactions (
                id, userId, type, categoryId, subCategoryId, amount, accountId, date, notes, linkedTransactionId, synced
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
            `, [
              creditTransactionId,
              transaction.userId,
              'credit',
              transaction.categoryId,
              null, // subCategoryId
              transaction.amount,
              transaction.transferTo,
              transaction.date,
              transaction.notes || '',
              transaction.id
            ]);
            
            // Update original transaction to be a debit transaction and link it to the credit transaction
            await db.runAsync(`
              UPDATE transactions 
              SET type = 'debit', linkedTransactionId = ?
              WHERE id = ?
            `, [creditTransactionId, transaction.id]);
          }
        }
      }
    }
    
    // Remove old columns if they exist but only after migration
    if (transferFromExists || transferToExists) {
      // In SQLite, we need to recreate the table to remove columns
      // This is a simplified approach - in a production app you might handle this differently
      console.log('Cleaning up old transfer columns');
      
      // We'll only do this if we've successfully migrated the data
      if (linkedTransactionIdExists) {
        // We don't actually remove the columns as SQLite doesn't support DROP COLUMN
        // Instead, we'll just stop using them
        console.log('Transfer columns will be ignored going forward');
      }
    }
  } catch (error) {
    console.error('Error migrating database:', error);
    throw error;
  }
};

const insertDefaultData = async (userId: string) => {
  try {
    // Note: Initial accounts are now created via the InitialBalanceModal component
    // instead of being automatically added here.

    // Insert default categories
    await db.runAsync(`
      INSERT OR IGNORE INTO categories (id, userId, name, type, icon, color, createdAt)
      VALUES 
        ('food_1', ?, 'Food & Dining', 'expense', '🍞', '#FF6B6B', datetime('now')),
        ('transport_1', ?, 'Transportation', 'expense', '🚗', '#4ECDC4', datetime('now')),
        ('shopping_1', ?, 'Shopping', 'expense', '🛒', '#45B7D1', datetime('now')),
        ('salary_1', ?, 'Salary', 'income', '💰', '#2ECC71', datetime('now')),
        ('freelance_1', ?, 'Freelance', 'income', '💻', '#3498DB', datetime('now')),
        ('transfer_1', ?, 'Transfer', 'transfer', '↔️', '#9B59B6', datetime('now'));
    `, [userId, userId, userId, userId, userId, userId, userId]);
    
    // Insert default subcategories
    await db.runAsync(`
      INSERT OR IGNORE INTO subcategories (id, userId, name, type, color, parentCategoryId, createdAt)
      VALUES 
        ('grocery_1', ?, 'Groceries', 'expense', '#FF6B6B', 'food_1', datetime('now')),
        ('restaurant_1', ?, 'Restaurants', 'expense', '#FF6B6B', 'food_1', datetime('now')),
        ('gas_1', ?, 'Gas', 'expense', '#4ECDC4', 'transport_1', datetime('now')),
        ('clothing_1', ?, 'Clothing', 'expense', '#45B7D1', 'shopping_1', datetime('now')),
        ('electronics_1', ?, 'Electronics', 'expense', '#45B7D1', 'shopping_1', datetime('now'));
    `, [userId, userId, userId, userId, userId]);
  } catch (error) {
    console.error('Error inserting default data:', error);
    throw error;
  }
};

// User Interest functions
export const addUserInterest = async (interest: UserInterest) => {
  try {
    await db.runAsync(
      `INSERT INTO user_interests (id, userId, interest, synced)
       VALUES (?, ?, ?, 0)`,
      [interest.id, interest.userId, interest.interest]
    );
  } catch (error) {
    console.error('Error adding user interest:', error);
    throw error;
  }
};

export const getUserInterests = async (userId: string) => {
  try {
    const interests = await db.getAllAsync<UserInterest>(
      `SELECT * FROM user_interests WHERE userId = ?`,
      [userId]
    );
    return interests;
  } catch (error) {
    console.error('Error getting user interests:', error);
    throw error;
  }
};

export const deleteUserInterest = async (interestId: string, userId: string) => {
  try {
    await db.runAsync(
      `DELETE FROM user_interests WHERE id = ? AND userId = ?`,
      [interestId, userId]
    );
  } catch (error) {
    console.error('Error deleting user interest:', error);
    throw error;
  }
};

// Subcategory functions
export const addSubcategory = async (subcategory: Subcategory) => {
  try {
    await db.runAsync(
      `INSERT INTO subcategories (id, userId, name, type, color, parentCategoryId, createdAt, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        subcategory.id,
        subcategory.userId,
        subcategory.name,
        subcategory.type,
        subcategory.color,
        subcategory.parentCategoryId,
        subcategory.createdAt || new Date().toISOString()
      ]
    );
  } catch (error) {
    console.error('Error adding subcategory:', error);
    throw error;
  }
};

export const getSubcategories = async (userId: string) => {
  try {
    const subcategories = await db.getAllAsync<Subcategory>(
      `SELECT * FROM subcategories WHERE userId = ?`,
      [userId]
    );
    return subcategories;
  } catch (error) {
    console.error('Error getting subcategories:', error);
    throw error;
  }
};

export const getSubcategoriesByCategory = async (categoryId: string) => {
  try {
    const subcategories = await db.getAllAsync<Subcategory>(
      `SELECT * FROM subcategories WHERE parentCategoryId = ?`,
      [categoryId]
    );
    return subcategories;
  } catch (error) {
    console.error('Error getting subcategories by category:', error);
    throw error;
  }
};

export const updateSubcategory = async (subcategory: Subcategory) => {
  try {
    await db.runAsync(
      `UPDATE subcategories 
       SET name = ?, type = ?, color = ?, parentCategoryId = ?, synced = 0
       WHERE id = ? AND userId = ?`,
      [
        subcategory.name,
        subcategory.type,
        subcategory.color,
        subcategory.parentCategoryId,
        subcategory.id,
        subcategory.userId
      ]
    );
  } catch (error) {
    console.error('Error updating subcategory:', error);
    throw error;
  }
};

export const deleteSubcategory = async (subcategoryId: string, userId: string) => {
  try {
    await db.runAsync(
      `DELETE FROM subcategories WHERE id = ? AND userId = ?`,
      [subcategoryId, userId]
    );
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    throw error;
  }
};

// Modified transaction function to include subCategoryId
export const addTransaction = async (transaction: Transaction) => {
  try {
    await db.runAsync(
      `INSERT INTO transactions (
        id, userId, type, categoryId, subCategoryId, amount, accountId, date, notes, linkedTransactionId, synced
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        transaction.id,
        transaction.userId,
        transaction.type,
        transaction.categoryId,
        transaction.subCategoryId || null,
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



// Function to get all data from a table
const getAllDataFromTable = async <T>(table: string): Promise<T[]> => {
  try {
    const result = await db.getAllAsync<T>(`SELECT * FROM ${table}`);
    return result;
  } catch (error) {
    console.error(`Error getting all data from ${table}:`, error);
    throw error;
  }
};

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

// Export functions to get all data from each table
export const getAllTransactions = async (): Promise<Transaction[]> => getAllDataFromTable<Transaction>('transactions');
export const getAllAccounts = async (): Promise<Account[]> => getAllDataFromTable<Account>('accounts');
export const getAllBudgets = async (): Promise<Budget[]> => getAllDataFromTable<Budget>('budgets');
export const getAllSubscriptions = async (): Promise<Subscription[]> => getAllDataFromTable<Subscription>('subscriptions');
export const getAllCategories = async (): Promise<Category[]> => getAllDataFromTable<Category>('categories');
export const getAllSubcategories = async (): Promise<Subcategory[]> => getAllDataFromTable<Subcategory>('subcategories');
export const getAllUserInterests = async (): Promise<UserInterest[]> => getAllDataFromTable<UserInterest>('user_interests');
export const getAllGoals = async (): Promise<Goal[]> => getAllDataFromTable<Goal>('goals');

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

export const deleteSubscription = async (subscriptionId: string, userId: string) => {
  try {
    await db.runAsync(
      `DELETE FROM subscriptions WHERE id = ? AND userId = ?`,
      [subscriptionId, userId]
    );
  } catch (error) {
    console.error('Error deleting subscription:', error);
    throw error;
  }
};

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

// Budget-specific functions
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

export const getBudgetsByUserId = async (userId: string) => {
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

export const getBudgetById = async (budgetId: string) => {
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

export const getBudgetSpending = async (categoryId: string, month: number, year: number) => {
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

export const getBudgetsWithSpending = async (userId: string) => {
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

// Goal-specific functions
export const addGoal = async (goal: Goal) => {
  try {
    await db.runAsync(
      `INSERT INTO goals (id, userId, title, emoji, targetAmount, targetDate, accountId, includeBalance, monthlyContribution, createdAt, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        goal.id,
        goal.userId,
        goal.title,
        goal.emoji,
        goal.targetAmount,
        goal.targetDate,
        goal.accountId,
        goal.includeBalance ? 1 : 0,
        goal.monthlyContribution,
        goal.createdAt || new Date().toISOString(),
        0
      ]
    );
  } catch (error) {
    console.error('Error adding goal:', error);
    throw error;
  }
};

export const updateGoal = async (goal: Goal) => {
  try {
    await db.runAsync(
      `UPDATE goals 
       SET title = ?, emoji = ?, targetAmount = ?, targetDate = ?, accountId = ?, includeBalance = ?, monthlyContribution = ?, synced = 0
       WHERE id = ? AND userId = ?`,
      [
        goal.title,
        goal.emoji,
        goal.targetAmount,
        goal.targetDate,
        goal.accountId,
        goal.includeBalance ? 1 : 0,
        goal.monthlyContribution,
        goal.id,
        goal.userId
      ]
    );
  } catch (error) {
    console.error('Error updating goal:', error);
    throw error;
  }
};

export const deleteGoal = async (goalId: string, userId: string) => {
  try {
    await db.runAsync(
      `DELETE FROM goals WHERE id = ? AND userId = ?`,
      [goalId, userId]
    );
  } catch (error) {
    console.error('Error deleting goal:', error);
    throw error;
  }
};

export const getGoalsByUserId = async (userId: string) => {
  try {
    const goals = await db.getAllAsync<Goal>(
      `SELECT * FROM goals WHERE userId = ?`,
      [userId]
    );
    return goals;
  } catch (error) {
    console.error('Error getting goals:', error);
    throw error;
  }
};

export const getGoalById = async (goalId: string) => {
  try {
    const goal = await db.getFirstAsync<Goal>(
      `SELECT * FROM goals WHERE id = ?`,
      [goalId]
    );
    return goal;
  } catch (error) {
    console.error('Error getting goal:', error);
    throw error;
  }
};
// User-specific functions
export const addUser = async (user: User) => {
  try {
    await db.runAsync(
      `INSERT INTO users (
        id, userId, firstName, lastName, phoneNumber, 
        avatar, dateOfBirth, occupation, createdAt, updatedAt, synced
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id,
        user.userId,
        user.firstName,
        user.lastName,
        user.phoneNumber,
        user.avatar || null,
        user.dateOfBirth || null,
        user.occupation || null,
        user.createdAt,
        user.updatedAt,
        0
      ]
    );
  } catch (error) {
    console.error('Error adding user:', error);
    throw error;
  }
};

export const getUserByUserId = async (userId: string) => {
  try {
    const user = await db.getFirstAsync<User>(
      `SELECT * FROM users WHERE userId = ?`,
      [userId]
    );
    return user;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

export const updateUser = async (user: User) => {
  try {
    await db.runAsync(
      `UPDATE users 
       SET firstName = ?, lastName = ?, phoneNumber = ?, 
           avatar = ?, dateOfBirth = ?, occupation = ?,
           updatedAt = ?, synced = 0
       WHERE userId = ?`,
      [
        user.firstName,
        user.lastName,
        user.phoneNumber,
        user.avatar || null,
        user.dateOfBirth || null,
        user.occupation || null,
        new Date().toISOString(),
        user.userId
      ]
    );
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async (userId: string) => {
  try {
    // This will cascade delete all user data due to foreign key constraints
    await db.runAsync(
      `DELETE FROM users WHERE userId = ?`,
      [userId]
    );
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

export const getAllUsers = async (): Promise<User[]> => getAllDataFromTable<User>('users');

// Clear database function with updated tables
export const clearDatabase = async () => {
  try {
    // Clearing in reverse order of foreign key dependencies
    await db.execAsync(`
      DELETE FROM user_interests;
      DELETE FROM goals;
      DELETE FROM transactions;
      DELETE FROM budgets;
      DELETE FROM subscriptions;
      DELETE FROM subcategories;
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

// Full user profile with interests
export const getFullUserProfile = async (userId: string) => {
  try {
    const user = await getUserByUserId(userId);
    if (!user) return null;
    
    const interests = await getUserInterests(userId);
    
    return {
      ...user,
      interests: interests || []
    };
  } catch (error) {
    console.error('Error getting full user profile:', error);
    throw error;
  }
};

// Update user profile with interests
export const updateUserProfile = async (user: User, interests: string[] = []) => {
  try {
    // Begin transaction
    await db.execAsync('BEGIN TRANSACTION;');
    
    // Update user data
    await updateUser(user);
    
    // Get existing interests
    const existingInterests = await getUserInterests(user.userId);
    const existingInterestValues = existingInterests.map(i => i.interest);
    
    // Delete interests that are no longer in the list
    for (const interest of existingInterests) {
      if (!interests.includes(interest.interest)) {
        await deleteUserInterest(interest.id, user.userId);
      }
    }
    
    // Add new interests
    for (const interest of interests) {
      if (!existingInterestValues.includes(interest)) {
        const interestId = `interest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        await addUserInterest({
          id: interestId,
          userId: user.userId,
          interest,
          synced: 0
        });
      }
    }
    
    // Commit transaction
    await db.execAsync('COMMIT;');
    
    return await getFullUserProfile(user.userId);
  } catch (error) {
    // Rollback on error
    await db.execAsync('ROLLBACK;');
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export default db;
