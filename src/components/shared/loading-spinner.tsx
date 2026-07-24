import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <Loader2 className={cn("h-6 w-6 animate-spin text-muted-foreground", className)} />
  );
}

export function LoadingPage() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <LoadingSpinner className="h-8 w-8" />
    </div>
  );
}
