import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 rounded-full bg-muted p-3">{icon}</div>
        <h3 className="mb-1 text-lg font-semibold">{title}</h3>
        <p className="mb-4 text-sm text-muted-foreground max-w-sm">{description}</p>
        {action}
      </CardContent>
    </Card>
  );
}
