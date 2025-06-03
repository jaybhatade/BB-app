import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../services/firebase';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import * as db from '../../db/dbUtils';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  hasCompletedUserForm: boolean;
  signOut: () => Promise<void>;
  setUserFormCompleted: (completed: boolean) => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  hasCompletedUserForm: false,
  signOut: async () => {},
  setUserFormCompleted: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedUserForm, setHasCompletedUserForm] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Check if the user has a profile in the database
        try {
          const userProfile = await db.getUserByUserId(user.uid);
          setHasCompletedUserForm(!!userProfile);
        } catch (error) {
          console.error('Error checking user profile:', error);
          setHasCompletedUserForm(false);
        }
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signOut = async () => {
    try {
      // Clear the database before signing out
      await db.clearDatabase();
      // Sign out from Firebase
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const setUserFormCompleted = (completed: boolean) => {
    setHasCompletedUserForm(completed);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      hasCompletedUserForm,
      signOut,
      setUserFormCompleted
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 