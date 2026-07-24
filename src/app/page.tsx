import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wallet, BarChart3, Shield, Zap, ArrowRight } from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Smart Analytics",
    description: "Visualize your spending patterns with beautiful charts and detailed reports.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your financial data is encrypted and protected with industry-standard security.",
  },
  {
    icon: Zap,
    title: "Fast & Easy",
    description: "Log expenses in seconds with our intuitive interface and smart categorization.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">ExpenseFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-20 text-center md:py-32">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 inline-flex items-center rounded-full border bg-muted px-4 py-1.5 text-sm">
              <Wallet className="mr-2 h-4 w-4" />
              Personal Expense Tracker
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Take control of your{" "}
              <span className="text-primary">finances</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              ExpenseFlow helps you track spending, analyze patterns, and achieve your financial goals
              with a clean, modern dashboard.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/register">
                <Button size="lg" className="gap-2">
                  Start Tracking Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <h2 className="mb-12 text-center text-3xl font-bold">Everything you need</h2>
            <div className="grid gap-8 md:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.title} className="rounded-xl border bg-card p-6 text-center shadow-sm transition-shadow hover:shadow-md">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t">
          <div className="mx-auto max-w-6xl px-4 py-20 text-center">
            <h2 className="mb-4 text-3xl font-bold">Ready to start saving?</h2>
            <p className="mb-8 text-muted-foreground">
              Join ExpenseFlow and take the first step towards financial clarity.
            </p>
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Create Free Account
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} ExpenseFlow. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">ExpenseFlow</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
