"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DollarSign, TrendingUp, Calculator, Hash } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
}

function StatCard({ title, value, description, icon, className }: StatCardProps) {
  return (
    <Card className={cn("transition-all hover:shadow-md", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="rounded-md bg-muted p-2">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

interface DashboardCardsProps {
  totalExpenses: number;
  currentMonthSpending: number;
  averageExpense: number;
  transactionCount: number;
}

export function DashboardCards({
  totalExpenses,
  currentMonthSpending,
  averageExpense,
  transactionCount,
}: DashboardCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Expenses"
        value={formatCurrency(totalExpenses)}
        description="All time spending"
        icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
      />
      <StatCard
        title="This Month"
        value={formatCurrency(currentMonthSpending)}
        description="Current month spending"
        icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
      />
      <StatCard
        title="Average Expense"
        value={formatCurrency(averageExpense)}
        description="Per transaction"
        icon={<Calculator className="h-4 w-4 text-muted-foreground" />}
      />
      <StatCard
        title="Transactions"
        value={transactionCount.toString()}
        description="Total recorded"
        icon={<Hash className="h-4 w-4 text-muted-foreground" />}
      />
    </div>
  );
}
