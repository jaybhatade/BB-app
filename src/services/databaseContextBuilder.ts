import { 
  getAllTransactions,
  getAllCategories,
  getAllAccounts,
  getAllBudgets,
  getAllGoals
} from '../../db/dbUtils';

/**
 * Utility to build financial context from the database
 * This will be used to provide context to the AI about the user's finances
 */
export async function buildDatabaseContext(): Promise<string> {
  try {
    // Fetch data from all relevant tables
    const transactions = await getAllTransactions();
    const categories = await getAllCategories();
    const accounts = await getAllAccounts();
    const budgets = await getAllBudgets();
    const goals = await getAllGoals();

    // Format transactions removing IDs
    const formattedTransactions = transactions.map(transaction => ({
      type: transaction.type,
      category: categories.find(c => c.id === transaction.categoryId)?.name || 'Uncategorized',
      amount: transaction.amount,
      account: accounts.find(a => a.id === transaction.accountId)?.name || 'Unknown Account',
      date: transaction.date,
      notes: transaction.notes
    }));

    // Format accounts removing IDs
    const formattedAccounts = accounts.map(account => ({
      name: account.name,
      balance: account.balance,
      icon: account.icon
    }));

    // Format categories removing IDs
    const formattedCategories = categories.map(category => ({
      name: category.name,
      type: category.type,
      icon: category.icon,
      color: category.color
    }));

    // Format budgets removing IDs
    const formattedBudgets = budgets.map(budget => ({
      category: categories.find(c => c.id === budget.categoryId)?.name || 'Uncategorized',
      limit: budget.budgetLimit,
      month: budget.month,
      year: budget.year
    }));

    // Format goals removing IDs
    const formattedGoals = goals.map(goal => ({
      title: goal.title,
      emoji: goal.emoji,
      targetAmount: goal.targetAmount,
      targetDate: goal.targetDate,
      account: accounts.find(a => a.id === goal.accountId)?.name || 'Unknown Account',
      includeBalance: goal.includeBalance,
      monthlyContribution: goal.monthlyContribution
    }));

    // Create a financial summary
    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
    const incomeCategories = categories.filter(c => c.type === 'income');
    const expenseCategories = categories.filter(c => c.type === 'expense');
    
    // Get recent transactions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentTransactions = transactions.filter(
      t => new Date(t.date) >= thirtyDaysAgo
    );
    
    // Calculate income/expense for recent transactions
    const recentIncome = recentTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const recentExpenses = recentTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Generate content for categories with most spending
    const categorySpending: Record<string, number> = {};
    recentTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const categoryId = t.categoryId;
        if (categoryId) {
          if (!categorySpending[categoryId]) {
            categorySpending[categoryId] = 0;
          }
          categorySpending[categoryId] += t.amount;
        }
      });
    
    // Get top spending categories
    const topCategories = Object.entries(categorySpending)
      .map(([categoryId, amount]) => ({
        category: categories.find(c => c.id === categoryId)?.name || 'Uncategorized',
        amount
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Build context string
    const contextParts = [
      "## Financial Overview",
      `Total Balance: ₹${totalBalance.toFixed(2)}`,
      `Recent Income (30 days): ₹${recentIncome.toFixed(2)}`,
      `Recent Expenses (30 days): ₹${recentExpenses.toFixed(2)}`,
      `Net Cash Flow (30 days): ₹${(recentIncome - recentExpenses).toFixed(2)}`,
      
      "\n## Top Spending Categories",
      ...topCategories.map(c => `- ${c.category}: ₹${c.amount.toFixed(2)}`),
      
      "\n## Accounts",
      ...formattedAccounts.map(a => `- ${a.name}: ₹${a.balance.toFixed(2)}`),
      
      "\n## Budgets",
      ...formattedBudgets.map(b => `- ${b.category}: ₹${b.limit.toFixed(2)} for ${getMonthName(b.month)} ${b.year}`),
      
      "\n## Financial Goals",
      ...formattedGoals.map(g => `- ${g.title} (${g.emoji}): ₹${g.targetAmount.toFixed(2)} by ${formatDate(g.targetDate)}, contributing ₹${g.monthlyContribution.toFixed(2)}/month`),
      
      "\n## Recent Transactions",
      ...formattedTransactions
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10)
        .map(t => `- ${formatDate(t.date)}: ${t.type === 'income' ? 'Received' : 'Spent'} ₹${t.amount.toFixed(2)} on ${t.category} (${t.account})${t.notes ? ` - Note: ${t.notes}` : ''}`)
    ];

    return contextParts.join("\n");
  } catch (error) {
    console.error('Error building database context:', error);
    return "Error retrieving financial data. Please try again later.";
  }
}

// Helper function to get month name
function getMonthName(monthIndex: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthIndex] || 'Unknown';
}

// Helper function to format date
function formatDate(dateString: string): string {
  if (!dateString) return 'Unknown date';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
} 