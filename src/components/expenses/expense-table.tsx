"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Trash2, Edit, Download, X } from "lucide-react";
import { CATEGORIES, getCategoryColor, EXPENSES_PER_PAGE } from "@/lib/constants";
import { useDebounce } from "@/hooks/use-debounce";
import { Pagination } from "@/components/shared/pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { deleteExpense, exportExpensesToCSV } from "@/actions/expenses";
import type { PaginatedExpenses } from "@/types";
import { format } from "date-fns";
import type { Expense } from "@prisma/client";

interface ExpenseTableProps {
  initialData: PaginatedExpenses;
  filters: {
    search: string;
    category: string;
    startDate: string;
    endDate: string;
  };
}

export function ExpenseTable({ initialData, filters }: ExpenseTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState(filters.search);
  const [category, setCategory] = useState(filters.category);
  const [startDate, setStartDate] = useState(filters.startDate);
  const [endDate, setEndDate] = useState(filters.endDate);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search);

  const updateFilters = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams();
      const s = updates.search !== undefined ? updates.search : debouncedSearch;
      const c = updates.category !== undefined ? updates.category : category;
      const sd = updates.startDate !== undefined ? updates.startDate : startDate;
      const ed = updates.endDate !== undefined ? updates.endDate : endDate;
      if (s) params.set("search", s);
      if (c) params.set("category", c);
      if (sd) params.set("startDate", sd);
      if (ed) params.set("endDate", ed);
      params.set("page", "1");
      router.push(`/expenses?${params.toString()}`);
    },
    [debouncedSearch, category, startDate, endDate, router]
  );

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteExpense(deleteId);
    setDeleteId(null);
    router.refresh();
  };

  const handleExport = async () => {
    const csv = await exportExpensesToCSV();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    params.set("page", String(page));
    router.push(`/expenses?${params.toString()}`);
  };

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setStartDate("");
    setEndDate("");
    router.push("/expenses");
  };

  const hasFilters = search || category || startDate || endDate;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-lg">Filters</CardTitle>
          <div className="flex gap-2">
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-1 h-3 w-3" />
                Clear
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-1 h-3 w-3" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search expenses..."
                className="pl-9"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  updateFilters({ search: e.target.value });
                }}
              />
            </div>
            <Select
              value={category}
              onValueChange={(v: string | null) => {
                const val = v === "all" ? "" : (v ?? "");
                setCategory(val);
                updateFilters({ category: val });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              placeholder="Start date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                updateFilters({ startDate: e.target.value });
              }}
            />
            <Input
              type="date"
              placeholder="End date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                updateFilters({ endDate: e.target.value });
              }}
            />
          </div>
        </CardContent>
      </Card>

      {initialData.expenses.length === 0 ? (
        <EmptyState
          icon={<Search className="h-6 w-6 text-muted-foreground" />}
          title="No expenses found"
          description={hasFilters ? "Try adjusting your filters" : "Start by adding your first expense"}
          action={
            hasFilters ? (
              <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>
            ) : (
              <Button onClick={() => router.push("/expenses/new")}>
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            )
          }
        />
      ) : (
        <>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialData.expenses.map((expense: Expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{expense.title}</p>
                        {expense.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {expense.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        style={{ backgroundColor: getCategoryColor(expense.category) + "20", color: getCategoryColor(expense.category) }}
                      >
                        {CATEGORIES.find((c) => c.id === expense.category)?.name ?? expense.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(expense.date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${expense.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => router.push(`/expenses/new?edit=${expense.id}`)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleteId(expense.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(initialData.currentPage - 1) * EXPENSES_PER_PAGE + 1}–
              {Math.min(initialData.currentPage * EXPENSES_PER_PAGE, initialData.totalCount)} of{" "}
              {initialData.totalCount} expenses
            </p>
            <Pagination
              currentPage={initialData.currentPage}
              totalPages={initialData.totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </>
      )}

      <ConfirmationDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Expense"
        description="Are you sure you want to delete this expense? This action cannot be undone."
        onConfirm={handleDelete}
      />
    </div>
  );
}
