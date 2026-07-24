"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register, type RegisterState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const initialState: RegisterState = { success: false, error: null, fieldErrors: {} };

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(register, initialState);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (state.success) {
      toast({ title: "Account created", description: "You can now sign in." });
      router.push("/login");
    }
  }, [state.success, router, toast]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
          <Wallet className="h-6 w-6 text-primary-foreground" />
        </div>
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>Start tracking your expenses today</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {state.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="John Doe" />
            {state.fieldErrors.name && (
              <p className="text-xs text-destructive">{state.fieldErrors.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="john@example.com" />
            {state.fieldErrors.email && (
              <p className="text-xs text-destructive">{state.fieldErrors.email}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" placeholder="••••••••" />
            {state.fieldErrors.password && (
              <p className="text-xs text-destructive">{state.fieldErrors.password}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input id="confirmPassword" name="confirmPassword" type="password" placeholder="••••••••" />
            {state.fieldErrors.confirmPassword && (
              <p className="text-xs text-destructive">{state.fieldErrors.confirmPassword}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create Account
          </Button>
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
