import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ExpenseForm } from "@/components/expenses/expense-form";

export const metadata = {
  title: "Add Expense - ExpenseFlow",
};

export default async function NewExpensePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const editId = params.edit;

  let expense: {
    id: string;
    title: string;
    amount: number;
    category: string;
    description: string | null;
    date: Date;
  } | undefined = undefined;

  if (editId) {
    const found = await db.expense.findFirst({
      where: { id: editId, userId: session.user.id! },
    });
    if (!found) redirect("/expenses");
    expense = found;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">
          {expense ? "Edit Expense" : "Add Expense"}
        </h1>
        <p className="text-muted-foreground">
          {expense ? "Update the expense details below" : "Track a new expense"}
        </p>
      </div>
      <div className="flex justify-center">
        <ExpenseForm expense={expense} />
      </div>
    </div>
  );
}
