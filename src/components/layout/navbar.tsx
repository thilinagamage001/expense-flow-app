"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Receipt,
  PlusCircle,
  User,
  LogOut,
  Wallet,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "./theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/expenses/new", label: "Add Expense", icon: PlusCircle },
  { href: "/profile", label: "Profile", icon: User },
];

interface NavLinksProps {
  onNavigate?: () => void;
  orientation?: "vertical" | "horizontal";
}

function NavLinks({ onNavigate, orientation = "vertical" }: NavLinksProps) {
  const pathname = usePathname();

  const isHorizontal = orientation === "horizontal";

  return (
    <nav
      className={cn(
        isHorizontal ? "flex items-center gap-1" : "flex flex-col gap-1"
      )}
    >
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href === "/expenses" && pathname.startsWith("/expenses"));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isHorizontal && "whitespace-nowrap",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function Navbar({ userName }: { userName: string }) {
  const [open, setOpen] = useState(false);
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 md:px-6">
        {/* Mobile hamburger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            }
          />
          <SheetContent side="left" className="w-72">
            <div className="flex items-center gap-2 pb-6">
              <Wallet className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">ExpenseFlow</span>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} orientation="vertical" />
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 mr-4 shrink-0">
          <Wallet className="h-5 w-5 text-primary" />
          <span className="hidden font-bold sm:inline-block">ExpenseFlow</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center flex-1">
          <NavLinks orientation="horizontal" />
        </div>

        {/* Right side: theme, avatar, logout */}
        <div className="flex items-center gap-1 ml-auto shrink-0">
          <ThemeToggle />
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
