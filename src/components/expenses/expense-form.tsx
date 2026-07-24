"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { createExpense, updateExpense, type ExpenseActionState } from "@/actions/expenses";
import { CATEGORIES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";

interface ExpenseFormProps {
  expense?: {
    id: string;
    title: string;
    amount: number;
    category: string;
    description: string | null;
    date: Date;
  };
}

const initialState: ExpenseActionState = { success: false, error: null, fieldErrors: {} };

export function ExpenseForm({ expense }: ExpenseFormProps) {
  const router = useRouter();
  const isEdit = !!expense;

  const action = async (prev: ExpenseActionState, formData: FormData) => {
    if (isEdit) {
      return updateExpense(expense.id, prev, formData);
    }
    return createExpense(prev, formData);
  };

  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <Card className="w-full max-w-2xl">
      <form action={formAction}>
        <CardContent className="space-y-4 pt-6">
          {state.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g. Grocery shopping"
                defaultValue={expense?.title}
              />
              {state.fieldErrors.title && (
                <p className="text-xs text-destructive">{state.fieldErrors.title}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                defaultValue={expense?.amount}
              />
              {state.fieldErrors.amount && (
                <p className="text-xs text-destructive">{state.fieldErrors.amount}</p>
              )}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select name="category" defaultValue={expense?.category}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {state.fieldErrors.category && (
                <p className="text-xs text-destructive">{state.fieldErrors.category}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={
                  expense
                    ? new Date(expense.date).toISOString().split("T")[0]
                    : new Date().toISOString().split("T")[0]
                }
              />
              {state.fieldErrors.date && (
                <p className="text-xs text-destructive">{state.fieldErrors.date}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Add any notes about this expense..."
              rows={3}
              defaultValue={expense?.description ?? ""}
            />
            {state.fieldErrors.description && (
              <p className="text-xs text-destructive">{state.fieldErrors.description}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isEdit ? "Update Expense" : "Add Expense"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
