import React, { createContext, useContext, useEffect, useState } from 'react';
import { clearDatabase } from '../../db/database-core';
import { setupDatabase } from 'db/database-setup';
import { useAuth } from './AuthContext';
import * as SQLite from 'expo-sqlite';

interface DatabaseContextType {
  isInitialized: boolean;
  isLoading: boolean;
  error: Error | null;
  reinitializeDatabase: () => Promise<void>;
  clearAllData: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType>({
  isInitialized: false,
  isLoading: true,
  error: null,
  reinitializeDatabase: async () => {},
  clearAllData: async () => {},
});

export const useDatabase = () => useContext(DatabaseContext);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const initializeDatabase = async () => {
    if (user) {
      setIsLoading(true);
      setError(null);
      
      try {
        await setupDatabase(user.uid);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setError(error instanceof Error ? error : new Error('Unknown database error'));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const reinitializeDatabase = async () => {
    setIsInitialized(false);
    await initializeDatabase();
  };

  const clearAllData = async () => {
    setIsLoading(true);
    try {
      await clearDatabase();
      setIsInitialized(false);
      console.log('Database cleared successfully');
    } catch (error) {
      console.error('Error clearing database:', error);
      setError(error instanceof Error ? error : new Error('Failed to clear database'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      initializeDatabase();
    } else {
      setIsInitialized(false);
      setIsLoading(false);
    }
  }, [user]);

  return (
    <DatabaseContext.Provider value={{ 
      isInitialized,
      isLoading,
      error,
      reinitializeDatabase,
      clearAllData
    }}>
      {children}
    </DatabaseContext.Provider>
  );
};