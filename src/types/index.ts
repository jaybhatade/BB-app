// Define types for the database entities
export interface Transaction {
  id: string;
  userId: string;
  type: string;
  categoryId: string;
  amount: number;
  accountId: string;
  date: string;
  notes?: string;
  transfer?: {
    fromAccountId?: string;
    toAccountId?: string;
  };
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  balance: number;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  budgetLimit: number;
  startDate: string;
  endDate: string;
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
  createdAt: string;
  synced: number;
} 