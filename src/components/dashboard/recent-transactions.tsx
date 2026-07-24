import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCategoryColor, CATEGORIES } from "@/lib/constants";
import { format } from "date-fns";
import type { Expense } from "@prisma/client";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function RecentTransactions({ expenses }: { expenses: Expense[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No transactions yet</p>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => {
              const color = getCategoryColor(expense.category);
              const catName = CATEGORIES.find((c) => c.id === expense.category)?.name ?? expense.category;
              return (
                <div key={expense.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <div>
                      <p className="text-sm font-medium">{expense.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(expense.date), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="text-xs"
                      style={{ backgroundColor: color + "20", color }}
                    >
                      {catName}
                    </Badge>
                    <span className="text-sm font-medium">
                      {formatCurrency(expense.amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
