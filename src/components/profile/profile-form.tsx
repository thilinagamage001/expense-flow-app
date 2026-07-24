"use client";

import { useActionState } from "react";
import { updateProfile } from "@/actions/expenses";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save } from "lucide-react";

interface ProfileFormProps {
  user: {
    name: string | null;
    email: string;
    createdAt: Date;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfile, {
    success: false,
    error: null,
  });

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        <CardDescription>Manage your account information</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {state.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}
          {state.success && (
            <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
              Profile updated successfully
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={user.name ?? ""} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={user.email} />
          </div>

          <Separator className="my-4" />

          <div className="space-y-2">
            <Label>Member Since</Label>
            <p className="text-sm text-muted-foreground">
              {new Date(user.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
