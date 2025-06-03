// user-management.ts
import { db } from './database-core';
import { User, UserInterest, UserProfile } from './types';

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

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const users = await db.getAllAsync<User>(`SELECT * FROM users`);
    return users;
  } catch (error) {
    console.error('Error getting all users:', error);
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

// Full user profile with interests
export const getFullUserProfile = async (userId: string): Promise<UserProfile | null> => {
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
export const updateUserProfile = async (user: User, interests: string[] = []): Promise<UserProfile | null> => {
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