"use client";

import { cn } from "@/lib/utils";

interface TimestampDisplayProps {
  iso: string | undefined;
  className?: string;
  relative?: boolean;
}

export default function TimestampDisplay({ iso, className, relative = true }: TimestampDisplayProps) {
  if (!iso) return <span className={cn("text-xs text-muted-foreground", className)}>—</span>;

  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (relative) {
    if (diffSec < 10) return <span className={cn("text-xs text-muted-foreground", className)}>just now</span>;
    if (diffSec < 60) return <span className={cn("text-xs text-muted-foreground", className)}>{diffSec}s ago</span>;
    if (diffMin < 60) return <span className={cn("text-xs text-muted-foreground", className)}>{diffMin}m ago</span>;
    if (diffHr < 24) return <span className={cn("text-xs text-muted-foreground", className)}>{diffHr}h ago</span>;
    if (diffDay < 7) return <span className={cn("text-xs text-muted-foreground", className)}>{diffDay}d ago</span>;
  }
  return <span className={cn("text-xs text-muted-foreground", className)}>{d.toLocaleDateString()}</span>;
}
