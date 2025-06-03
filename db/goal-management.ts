// goal-management.ts
import { db } from './database-core';
import { Goal } from './types';

// Add a new financial goal
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

// Update an existing goal
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

// Delete a goal
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

// Get all goals for a specific user
export const getGoalsByUserId = async (userId: string): Promise<Goal[]> => {
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

// Get a specific goal by ID
export const getGoalById = async (goalId: string): Promise<Goal | null> => {
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

// Get all goals (for admin purposes)
export const getAllGoals = async (): Promise<Goal[]> => {
  try {
    const goals = await db.getAllAsync<Goal>(`SELECT * FROM goals`);
    return goals;
  } catch (error) {
    console.error('Error getting all goals:', error);
    throw error;
  }
};

// Calculate progress for a specific goal
export const calculateGoalProgress = async (goalId: string): Promise<{ 
  currentAmount: number; 
  percentComplete: number; 
  daysRemaining: number;
  isOnTrack: boolean;
  projectedCompletion: string;
}> => {
  try {
    const goal = await getGoalById(goalId);
    if (!goal) {
      throw new Error('Goal not found');
    }

    // If includeBalance is true, get the current account balance
    let currentAmount = 0;
    if (goal.includeBalance) {
      const accountResult = await db.getFirstAsync<{ balance: number }>(
        `SELECT balance FROM accounts WHERE id = ?`,
        [goal.accountId]
      );
      currentAmount = accountResult?.balance || 0;
    }

    // Calculate any additional contributions since goal creation
    const contributionsResult = await db.getFirstAsync<{ totalAmount: number }>(
      `SELECT SUM(amount) as totalAmount FROM transactions 
       WHERE accountId = ? AND type = 'credit' AND date >= ?`,
      [goal.accountId, goal.createdAt]
    );
    
    currentAmount += contributionsResult?.totalAmount || 0;
    
    // Calculate percent complete
    const percentComplete = (currentAmount / goal.targetAmount) * 100;
    
    // Calculate days remaining
    const targetDate = new Date(goal.targetDate);
    const currentDate = new Date();
    const daysRemaining = Math.max(0, Math.floor((targetDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Calculate if on track
    const totalDays = Math.floor((targetDate.getTime() - new Date(goal.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const daysPassed = totalDays - daysRemaining;
    const expectedProgress = (daysPassed / totalDays) * 100;
    const isOnTrack = percentComplete >= expectedProgress;
    
    // Calculate projected completion date based on current rate
    let projectedCompletionDate = new Date();
    if (daysPassed > 0 && currentAmount > 0) {
      const dailyRate = currentAmount / daysPassed;
      const daysNeeded = (goal.targetAmount - currentAmount) / dailyRate;
      projectedCompletionDate = new Date(currentDate.getTime() + (daysNeeded * 24 * 60 * 60 * 1000));
    } else {
      projectedCompletionDate = targetDate;
    }
    
    return {
      currentAmount,
      percentComplete,
      daysRemaining,
      isOnTrack,
      projectedCompletion: projectedCompletionDate.toISOString()
    };
  } catch (error) {
    console.error('Error calculating goal progress:', error);
    throw error;
  }
};

// Get goals with their progress information
export const getGoalsWithProgress = async (userId: string) => {
  try {
    const goals = await getGoalsByUserId(userId);
    
    const goalsWithProgress = await Promise.all(
      goals.map(async (goal) => {
        const progress = await calculateGoalProgress(goal.id);
        return {
          ...goal,
          ...progress
        };
      })
    );
    
    return goalsWithProgress;
  } catch (error) {
    console.error('Error getting goals with progress:', error);
    throw error;
  }
};