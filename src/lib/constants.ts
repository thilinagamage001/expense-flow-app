import {
  UtensilsCrossed,
  Car,
  ShoppingBag,
  Receipt,
  Film,
  Heart,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

export const CATEGORIES = [
  { id: "food", name: "Food", icon: UtensilsCrossed, color: "#ef4444" },
  { id: "transportation", name: "Transportation", icon: Car, color: "#f97316" },
  { id: "shopping", name: "Shopping", icon: ShoppingBag, color: "#eab308" },
  { id: "bills", name: "Bills", icon: Receipt, color: "#22c55e" },
  { id: "entertainment", name: "Entertainment", icon: Film, color: "#3b82f6" },
  { id: "healthcare", name: "Healthcare", icon: Heart, color: "#a855f7" },
  { id: "other", name: "Other", icon: HelpCircle, color: "#6b7280" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export const getCategoryById = (id: string) =>
  CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];

export const getCategoryColor = (id: string) => getCategoryById(id).color;

export const getCategoryIcon = (id: string): LucideIcon =>
  getCategoryById(id).icon;

export const EXPENSES_PER_PAGE = 10;

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
