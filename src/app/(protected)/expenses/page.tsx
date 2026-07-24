import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { getExpenses } from "@/actions/expenses";
import { ExpenseTable } from "@/components/expenses/expense-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const metadata = {
  title: "Expenses - ExpenseFlow",
};

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const filters = {
    search: params.search ?? "",
    category: params.category ?? "",
    startDate: params.startDate ?? "",
    endDate: params.endDate ?? "",
    page: params.page ? parseInt(params.page) : 1,
  };

  const data = await getExpenses(filters);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Expenses</h1>
          <p className="text-muted-foreground">Manage and track your expenses</p>
        </div>
        <Link href="/expenses/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
        </Link>
      </div>

      <ExpenseTable
        initialData={data}
        filters={{
          search: filters.search,
          category: filters.category,
          startDate: filters.startDate,
          endDate: filters.endDate,
        }}
      />
    </div>
  );
}
