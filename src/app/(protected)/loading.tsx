import { LoadingSpinner } from "@/components/shared/loading-spinner";

export default function ProtectedLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}
