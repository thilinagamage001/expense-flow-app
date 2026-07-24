import { Expense, User } from "@prisma/client";

export type ExpenseWithUser = Expense & {
  user: Pick<User, "id" | "name" | "email">;
};

export type ExpenseFormData = {
  title: string;
  amount: number;
  category: string;
  description?: string;
  date: string;
};

export type DashboardStats = {
  totalExpenses: number;
  currentMonthSpending: number;
  averageExpense: number;
  transactionCount: number;
};

export type CategoryBreakdown = {
  category: string;
  amount: number;
  count: number;
  color: string;
};

export type MonthlyTrend = {
  month: string;
  amount: number;
};

export type ExpenseFilters = {
  search?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
};

export type PaginatedExpenses = {
  expenses: Expense[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
};
