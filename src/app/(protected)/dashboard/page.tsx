import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import {
  getDashboardStats,
  getCategoryBreakdown,
  getMonthlyTrends,
  getRecentExpenses,
} from "@/actions/expenses";
import { DashboardCards } from "@/components/dashboard/stat-cards";
import { CategoryChart } from "@/components/dashboard/category-chart";
import { MonthlyChart } from "@/components/dashboard/monthly-chart";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";

export const metadata = {
  title: "Dashboard - ExpenseFlow",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const [stats, categoryData, monthlyData, recentExpenses] = await Promise.all([
    getDashboardStats(),
    getCategoryBreakdown(),
    getMonthlyTrends(),
    getRecentExpenses(5),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your spending</p>
      </div>

      <DashboardCards
        totalExpenses={stats.totalExpenses}
        currentMonthSpending={stats.currentMonthSpending}
        averageExpense={stats.averageExpense}
        transactionCount={stats.transactionCount}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <CategoryChart data={categoryData} />
        <MonthlyChart data={monthlyData} />
      </div>

      <div className="mt-6">
        <RecentTransactions expenses={recentExpenses} />
      </div>
    </div>
  );
}
