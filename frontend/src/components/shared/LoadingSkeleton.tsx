import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  variant?: "card" | "table" | "list" | "text";
  count?: number;
  className?: string;
}

export default function LoadingSkeleton({ variant = "card", count = 3, className }: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => {
        switch (variant) {
          case "card":
            return <Skeleton key={i} className="h-32 w-full rounded-lg" />;
          case "table":
            return <Skeleton key={i} className="h-12 w-full" />;
          case "list":
            return (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
            );
          case "text":
            return <Skeleton key={i} className="h-4 w-full" />;
          default:
            return <Skeleton key={i} className="h-16 w-full" />;
        }
      })}
    </div>
  );
}
