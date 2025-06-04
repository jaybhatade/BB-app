// database-setup.ts
import { db, INIT_TABLE_NAME } from './database-core';

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
        description TEXT,
        createdAt TEXT,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT,
        type TEXT,
        title TEXT,
        categoryId TEXT,
        amount REAL,
        accountId TEXT,
        date TEXT,
        notes TEXT,
        linkedTransactionId TEXT,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (categoryId) REFERENCES categories (id) ON DELETE SET NULL,
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
        status TEXT DEFAULT 'active',
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
export const migrateDatabase = async () => {
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

    // Check if categories table has description column
    const categoryColumns = await db.getAllAsync("PRAGMA table_info(categories);");
    const descriptionExists = categoryColumns.some((column: any) => column.name === 'description');

    if (!descriptionExists) {
      console.log('Adding description column to categories table');
      await db.execAsync("ALTER TABLE categories ADD COLUMN description TEXT;");
    }
    
    // Check if transactions table has the title column
    const transactionColumns = await db.getAllAsync("PRAGMA table_info(transactions);");
    const titleExists = transactionColumns.some((column: any) => column.name === 'title');

    if (!titleExists) {
      console.log('Adding title column to transactions table');
      await db.execAsync("ALTER TABLE transactions ADD COLUMN title TEXT;");
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

    if (!linkedTransactionIdExists) {
      console.log('Adding linkedTransactionId column to transactions table');
      await db.execAsync(
        "ALTER TABLE transactions ADD COLUMN linkedTransactionId TEXT REFERENCES transactions(id);"
      );
    }

    // Drop subcategories table if it exists
    if (tableNames.includes('subcategories')) {
      console.log('Dropping subcategories table');
      await db.execAsync("DROP TABLE IF EXISTS subcategories;");
    }

    // Remove subCategoryId column from transactions if it exists
    const subCategoryIdExists = transactionColumns.some((column: any) => column.name === 'subCategoryId');
    if (subCategoryIdExists) {
      console.log('Removing subCategoryId column from transactions table');
      // Create a temporary table without subCategoryId
      await db.execAsync(`
        CREATE TABLE transactions_temp (
          id TEXT PRIMARY KEY NOT NULL,
          userId TEXT,
          type TEXT,
          title TEXT,
          categoryId TEXT,
          amount REAL,
          accountId TEXT,
          date TEXT,
          notes TEXT,
          linkedTransactionId TEXT,
          synced INTEGER DEFAULT 0,
          FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
          FOREIGN KEY (categoryId) REFERENCES categories (id) ON DELETE SET NULL,
          FOREIGN KEY (accountId) REFERENCES accounts (id) ON DELETE CASCADE,
          FOREIGN KEY (linkedTransactionId) REFERENCES transactions (id) ON DELETE SET NULL
        );
      `);
      
      // Copy data from old table to new table
      await db.execAsync(`
        INSERT INTO transactions_temp 
        SELECT id, userId, type, title, categoryId, amount, accountId, date, notes, linkedTransactionId, synced
        FROM transactions;
      `);
      
      // Drop old table and rename new table
      await db.execAsync(`
        DROP TABLE transactions;
        ALTER TABLE transactions_temp RENAME TO transactions;
      `);
    }

    // Check if goals table has the status column
    const goalColumns = await db.getAllAsync("PRAGMA table_info(goals);");
    const statusExists = goalColumns.some((column: any) => column.name === 'status');

    if (!statusExists) {
      console.log('Adding status column to goals table');
      await db.execAsync("ALTER TABLE goals ADD COLUMN status TEXT DEFAULT 'active';");
    }
  } catch (error) {
    console.error('Error migrating database:', error);
    throw error;
  }
};

export const migrateRemoveSubcategories = async () => {
  try {
    // Get all table names
    const tableNames = await db.getAllAsync("SELECT name FROM sqlite_master WHERE type='table';");
    const tableNamesList = tableNames.map((t: any) => t.name);

    // Drop subcategories table if it exists
    if (tableNamesList.includes('subcategories')) {
      console.log('Dropping subcategories table');
      await db.execAsync("DROP TABLE IF EXISTS subcategories;");
    }

    // Remove subCategoryId column from transactions if it exists
    const transactionColumns = await db.getAllAsync("PRAGMA table_info(transactions);");
    const subCategoryIdExists = transactionColumns.some((column: any) => column.name === 'subCategoryId');
    
    if (subCategoryIdExists) {
      console.log('Removing subCategoryId column from transactions table');
      // Create a temporary table without subCategoryId
      await db.execAsync(`
        CREATE TABLE transactions_temp (
          id TEXT PRIMARY KEY NOT NULL,
          userId TEXT,
          type TEXT,
          title TEXT,
          categoryId TEXT,
          amount REAL,
          accountId TEXT,
          date TEXT,
          notes TEXT,
          linkedTransactionId TEXT,
          synced INTEGER DEFAULT 0,
          FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
          FOREIGN KEY (categoryId) REFERENCES categories (id) ON DELETE SET NULL,
          FOREIGN KEY (accountId) REFERENCES accounts (id) ON DELETE CASCADE,
          FOREIGN KEY (linkedTransactionId) REFERENCES transactions (id) ON DELETE SET NULL
        );
      `);
      
      // Copy data from old table to new table
      await db.execAsync(`
        INSERT INTO transactions_temp 
        SELECT id, userId, type, title, categoryId, amount, accountId, date, notes, linkedTransactionId, synced
        FROM transactions;
      `);
      
      // Drop old table and rename new table
      await db.execAsync(`
        DROP TABLE transactions;
        ALTER TABLE transactions_temp RENAME TO transactions;
      `);
    }
  } catch (error) {
    console.error('Error migrating to remove subcategories:', error);
    throw error;
  }
};

export const insertDefaultData = async (userId: string) => {
  try {
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
    `, [userId, userId, userId, userId, userId, userId]);
  } catch (error) {
    console.error('Error inserting default data:', error);
    throw error;
  }
};