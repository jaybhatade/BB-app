// subscription-management.ts
import { db } from './database-core';
import { Subscription } from './types';

// Add a new subscription
export const addSubscription = async (subscription: Subscription) => {
  try {
    await db.runAsync(
      `INSERT INTO subscriptions (
        id, userId, name, amount, categoryId, status, renewalDate, createdAt, synced
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        subscription.id,
        subscription.userId,
        subscription.name,
        subscription.amount,
        subscription.categoryId,
        subscription.status,
        subscription.renewalDate,
        subscription.createdAt || new Date().toISOString(),
        0
      ]
    );
  } catch (error) {
    console.error('Error adding subscription:', error);
    throw error;
  }
};

// Update an existing subscription
export const updateSubscription = async (subscription: Subscription) => {
  try {
    await db.runAsync(
      `UPDATE subscriptions 
       SET name = ?, amount = ?, categoryId = ?, status = ?, renewalDate = ?, synced = 0
       WHERE id = ? AND userId = ?`,
      [
        subscription.name,
        subscription.amount,
        subscription.categoryId,
        subscription.status,
        subscription.renewalDate,
        subscription.id,
        subscription.userId
      ]
    );
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
};

// Delete a subscription
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

// Get all subscriptions for a user
export const getSubscriptionsByUserId = async (userId: string): Promise<Subscription[]> => {
  try {
    const subscriptions = await db.getAllAsync<Subscription>(
      `SELECT * FROM subscriptions WHERE userId = ?`,
      [userId]
    );
    return subscriptions;
  } catch (error) {
    console.error('Error getting subscriptions:', error);
    throw error;
  }
};

// Get a specific subscription by ID
export const getSubscriptionById = async (subscriptionId: string): Promise<Subscription | null> => {
  try {
    const subscription = await db.getFirstAsync<Subscription>(
      `SELECT * FROM subscriptions WHERE id = ?`,
      [subscriptionId]
    );
    return subscription;
  } catch (error) {
    console.error('Error getting subscription:', error);
    throw error;
  }
};

// Get all subscriptions (for admin purposes)
export const getAllSubscriptions = async (): Promise<Subscription[]> => {
  try {
    const subscriptions = await db.getAllAsync<Subscription>(`SELECT * FROM subscriptions`);
    return subscriptions;
  } catch (error) {
    console.error('Error getting all subscriptions:', error);
    throw error;
  }
};

// Get upcoming subscription renewals within a specified time frame (in days)
export const getUpcomingRenewals = async (userId: string, daysAhead: number = 7): Promise<Subscription[]> => {
  try {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);
    
    const todayStr = today.toISOString().split('T')[0];
    const futureDateStr = futureDate.toISOString().split('T')[0];
    
    const upcomingRenewals = await db.getAllAsync<Subscription>(
      `SELECT * FROM subscriptions 
       WHERE userId = ? AND status = 'active' AND renewalDate BETWEEN ? AND ?`,
      [userId, todayStr, futureDateStr]
    );
    
    return upcomingRenewals;
  } catch (error) {
    console.error('Error getting upcoming renewals:', error);
    throw error;
  }
};

// Update subscription status
export const updateSubscriptionStatus = async (subscriptionId: string, userId: string, status: string) => {
  try {
    await db.runAsync(
      `UPDATE subscriptions 
       SET status = ?, synced = 0
       WHERE id = ? AND userId = ?`,
      [status, subscriptionId, userId]
    );
  } catch (error) {
    console.error('Error updating subscription status:', error);
    throw error;
  }
};

// Calculate monthly subscription expense
export const getMonthlySubscriptionExpense = async (userId: string): Promise<number> => {
  try {
    const activeSubscriptions = await db.getAllAsync<Subscription>(
      `SELECT * FROM subscriptions 
       WHERE userId = ? AND status = 'active'`,
      [userId]
    );
    
    // Simple sum of all active subscription amounts
    const totalMonthlyExpense = activeSubscriptions.reduce(
      (total, subscription) => total + subscription.amount, 
      0
    );
    
    return totalMonthlyExpense;
  } catch (error) {
    console.error('Error calculating monthly subscription expense:', error);
    throw error;
  }
};

// Get subscriptions by category
export const getSubscriptionsByCategory = async (userId: string, categoryId: string): Promise<Subscription[]> => {
  try {
    const subscriptions = await db.getAllAsync<Subscription>(
      `SELECT * FROM subscriptions 
       WHERE userId = ? AND categoryId = ?`,
      [userId, categoryId]
    );
    return subscriptions;
  } catch (error) {
    console.error('Error getting subscriptions by category:', error);
    throw error;
  }
};

// Check for duplicate subscriptions (similar name and amount)
export const checkDuplicateSubscription = async (
  userId: string, 
  name: string, 
  amount: number
): Promise<boolean> => {
  try {
    // Look for subscriptions with similar name and exact amount
    const possibleDuplicates = await db.getAllAsync<Subscription>(
      `SELECT * FROM subscriptions 
       WHERE userId = ? AND amount = ? AND name LIKE ?`,
      [userId, amount, `%${name}%`]
    );
    
    return possibleDuplicates.length > 0;
  } catch (error) {
    console.error('Error checking for duplicate subscriptions:', error);
    throw error;
  }
};