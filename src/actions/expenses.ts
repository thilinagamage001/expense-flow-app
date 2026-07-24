"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  expenseSchema,
  type ExpenseInput,
} from "@/validations/expense";
import type {
  DashboardStats,
  CategoryBreakdown,
  MonthlyTrend,
  PaginatedExpenses,
  ExpenseFilters,
} from "@/types";
import { EXPENSES_PER_PAGE, getCategoryColor } from "@/lib/constants";

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  return session.user.id;
}

export type ExpenseActionState = {
  success: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
};

export async function createExpense(
  _prev: ExpenseActionState,
  formData: FormData
): Promise<ExpenseActionState> {
  const userId = await requireUser();

  const raw: ExpenseInput = {
    title: formData.get("title") as string,
    amount: parseFloat(formData.get("amount") as string),
    category: formData.get("category") as string,
    description: (formData.get("description") as string) || "",
    date: formData.get("date") as string,
  };

  const parsed = expenseSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      const field = issue.path[0] as string;
      fieldErrors[field] = issue.message;
    });
    return { success: false, error: null, fieldErrors };
  }

  const { title, amount, category, description, date } = parsed.data;

  await db.expense.create({
    data: {
      userId,
      title,
      amount,
      category,
      description: description || null,
      date: new Date(date),
    },
  });

  redirect("/expenses");
}

export async function updateExpense(
  id: string,
  _prev: ExpenseActionState,
  formData: FormData
): Promise<ExpenseActionState> {
  const userId = await requireUser();

  const raw: ExpenseInput = {
    title: formData.get("title") as string,
    amount: parseFloat(formData.get("amount") as string),
    category: formData.get("category") as string,
    description: (formData.get("description") as string) || "",
    date: formData.get("date") as string,
  };

  const parsed = expenseSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    parsed.error.issues.forEach((issue) => {
      const field = issue.path[0] as string;
      fieldErrors[field] = issue.message;
    });
    return { success: false, error: null, fieldErrors };
  }

  const existing = await db.expense.findFirst({ where: { id, userId } });
  if (!existing) {
    return { success: false, error: "Expense not found", fieldErrors: {} };
  }

  const { title, amount, category, description, date } = parsed.data;

  await db.expense.update({
    where: { id },
    data: {
      title,
      amount,
      category,
      description: description || null,
      date: new Date(date),
    },
  });

  redirect("/expenses");
}

export async function deleteExpense(id: string) {
  const userId = await requireUser();
  const existing = await db.expense.findFirst({ where: { id, userId } });
  if (!existing) {
    return { success: false, error: "Expense not found" };
  }

  await db.expense.delete({ where: { id } });
  revalidatePath("/expenses");
  revalidatePath("/dashboard");
  return { success: true, error: null };
}

export async function getExpenses(
  filters: ExpenseFilters
): Promise<PaginatedExpenses> {
  const userId = await requireUser();
  const page = filters.page ?? 1;
  const where: Record<string, unknown> = { userId };

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters.category) {
    where.category = filters.category;
  }

  if (filters.startDate || filters.endDate) {
    where.date = {};
    if (filters.startDate) {
      (where.date as Record<string, Date>).gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      (where.date as Record<string, Date>).lte = new Date(filters.endDate);
    }
  }

  const [expenses, totalCount] = await Promise.all([
    db.expense.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * EXPENSES_PER_PAGE,
      take: EXPENSES_PER_PAGE,
    }),
    db.expense.count({ where }),
  ]);

  return {
    expenses,
    totalCount,
    totalPages: Math.ceil(totalCount / EXPENSES_PER_PAGE),
    currentPage: page,
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const userId = await requireUser();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalResult, monthResult, countResult] = await Promise.all([
    db.expense.aggregate({
      where: { userId },
      _sum: { amount: true },
    }),
    db.expense.aggregate({
      where: { userId, date: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    db.expense.count({ where: { userId } }),
  ]);

  const totalExpenses = totalResult._sum.amount ?? 0;
  const currentMonthSpending = monthResult._sum.amount ?? 0;
  const transactionCount = countResult;
  const averageExpense = transactionCount > 0 ? totalExpenses / transactionCount : 0;

  return {
    totalExpenses,
    currentMonthSpending,
    averageExpense,
    transactionCount,
  };
}

export async function getCategoryBreakdown(): Promise<CategoryBreakdown[]> {
  const userId = await requireUser();

  const grouped = await db.expense.groupBy({
    by: ["category"],
    where: { userId },
    _sum: { amount: true },
    _count: true,
    orderBy: { _sum: { amount: "desc" } },
  });

  return grouped.map((item) => ({
    category: item.category,
    amount: item._sum.amount ?? 0,
    count: item._count,
    color: getCategoryColor(item.category),
  }));
}

export async function getMonthlyTrends(): Promise<MonthlyTrend[]> {
  const userId = await requireUser();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const expenses = await db.expense.findMany({
    where: { userId, date: { gte: sixMonthsAgo } },
    select: { amount: true, date: true },
  });

  const monthlyMap = new Map<string, number>();
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, 0);
  }

  expenses.forEach((e) => {
    const d = new Date(e.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthlyMap.has(key)) {
      monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + e.amount);
    }
  });

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return Array.from(monthlyMap.entries()).map(([key, amount]) => {
    const [year, month] = key.split("-");
    return {
      month: `${monthNames[parseInt(month) - 1]} ${year.slice(2)}`,
      amount,
    };
  });
}

export async function getRecentExpenses(limit = 5) {
  const userId = await requireUser();
  return db.expense.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: limit,
  });
}

export async function updateProfile(
  _prev: { success: boolean; error: string | null },
  formData: FormData
): Promise<{ success: boolean; error: string | null }> {
  const userId = await requireUser();
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;

  if (!name || name.length < 2) {
    return { success: false, error: "Name must be at least 2 characters" };
  }

  if (!email || !email.includes("@")) {
    return { success: false, error: "Invalid email address" };
  }

  const existing = await db.user.findFirst({
    where: { email, NOT: { id: userId } },
  });
  if (existing) {
    return { success: false, error: "Email is already in use" };
  }

  await db.user.update({
    where: { id: userId },
    data: { name, email },
  });

  revalidatePath("/profile");
  return { success: true, error: null };
}

export async function exportExpensesToCSV() {
  const userId = await requireUser();
  const expenses = await db.expense.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });

  const headers = ["Title", "Amount", "Category", "Description", "Date"];
  const rows = expenses.map((e) => [
    e.title,
    e.amount.toFixed(2),
    e.category,
    e.description ?? "",
    new Date(e.date).toISOString().split("T")[0],
  ]);

  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  return csv;
}
