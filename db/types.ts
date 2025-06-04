// types.ts
// Shared interfaces for the application

export interface User {
    id: string;
    userId: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    avatar?: string;
    dateOfBirth?: string;
    occupation?: string;
    createdAt: string;
    updatedAt: string;
    synced: number;
  }
  
  export interface UserInterest {
    id: string;
    userId: string;
    interest: string;
    synced: number;
  }
  
  export interface Transaction {
    id: string;
    userId: string;
    type: string;
    title?: string;
    categoryId: string;
    amount: number;
    accountId: string;
    date: string;
    notes?: string;
    linkedTransactionId?: string;
    synced: number;
  }
  
  export interface Account {
    id: string;
    userId: string;
    name: string;
    balance: number;
    icon: string;
    createdAt: string;
    updatedAt: string;
    synced: number;
  }
  
  export interface Budget {
    id: string;
    userId: string;
    categoryId: string;
    budgetLimit: number;
    month: number; // 0-11 for January-December
    year: number;
    createdAt: string;
    synced: number;
  }
  
  export interface Subscription {
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
  
  export interface Category {
    id: string;
    userId: string;
    name: string;
    type: string;
    icon: string;
    color: string;
    description?: string;
    createdAt: string;
    synced: number;
  }
  
  export interface Goal {
    id: string;
    userId: string;
    title: string;
    emoji: string;
    targetAmount: number;
    targetDate: string;
    accountId: string;
    includeBalance: boolean;
    monthlyContribution: number;
    status: 'active' | 'completed' | 'cancelled';
    createdAt: string;
    synced: number;
  }
  
  export interface BudgetWithSpending extends Budget {
    spent: number;
    remaining: number;
    percentUsed: number;
  }
  
  export interface UserProfile extends User {
    interests: UserInterest[];
  }