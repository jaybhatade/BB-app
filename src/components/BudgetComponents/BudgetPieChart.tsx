import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { useAuth } from '../../contexts/AuthContext';
import * as budgetDb from '../../../db/budget-management';
import fontStyles  from '../../utils/fontStyles'

interface BudgetPieChartProps {
  isDarkMode: boolean;
  selectedMonth: number;
  selectedYear: number;
}

interface BudgetData {
  totalBudget: number;
  spent: number;
  remaining: number;
}

const BudgetPieChart: React.FC<BudgetPieChartProps> = ({
  isDarkMode,
  selectedMonth,
  selectedYear,
}) => {
  const { user } = useAuth();
  const [budgetData, setBudgetData] = useState<BudgetData>({
    totalBudget: 0,
    spent: 0,
    remaining: 0
  });

  useEffect(() => {
    const fetchBudgetData = async () => {
      if (user) {
        try {
          // Get all budgets for the selected month
          const budgets = await budgetDb.getBudgetsWithSpending(user.uid);
          const selectedMonthBudgets = budgets.filter(
            budget => budget.month === selectedMonth && budget.year === selectedYear
          );

          // Calculate totals
          const totalBudget = selectedMonthBudgets.reduce((sum, budget) => sum + budget.budgetLimit, 0);
          const totalSpent = selectedMonthBudgets.reduce((sum, budget) => sum + budget.spent, 0);
          const remaining = totalBudget - totalSpent;

          setBudgetData({
            totalBudget,
            spent: totalSpent,
            remaining
          });
        } catch (error) {
          console.error('Error fetching budget data:', error);
        }
      }
    };

    fetchBudgetData();
  }, [user, selectedMonth, selectedYear]);

  return (
    <View className="items-center mt-4 mb-4">
      <PieChart
        data={[
          { value: budgetData.spent, color: '#0ea5e9' }, // Red for spent amount
          { value: budgetData.remaining, color: '#1E293B' }, // Green for remaining amount
        ]}
        radius={150}
        innerRadius={120}
        centerLabelComponent={() => {
          return (
            <View className="items-center justify-center">
              <Text style={fontStyles('extrabold')}  className="text-white text-5xl font-bold">
                ₹{budgetData.remaining}
              </Text>
              <Text style={fontStyles('extrabold')}  className="text-slate-500 text-lg">
                remaining of ₹{budgetData.totalBudget}
              </Text>
            </View>
          );
        }}
        backgroundColor='#0F172A'
      />
      <View className="flex-row gap-2 justify-center mt-4 space-x-4">
        <View className="flex-row items-center">
          <View className="w-3 h-3 rounded-full bg-[#1E293B] mr-2" />
          <Text style={fontStyles('extrabold')}  className="text-slate-500">Remaining</Text>
        </View>
        <View className="flex-row items-center">
          <View className="w-3 h-3 rounded-full bg-Primary mr-2" />
          <Text style={fontStyles('extrabold')}  className="text-slate-500">Spent</Text>
        </View>
      </View>
    </View>
  );
};

export default BudgetPieChart; 