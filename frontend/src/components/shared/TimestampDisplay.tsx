"use client";

import { cn } from "@/lib/utils";

interface TimestampDisplayProps {
  iso: string | undefined;
  className?: string;
  relative?: boolean;
  mode?: "datetime" | "date" | "time" | "relative" | "both";
}

export default function TimestampDisplay({
  iso,
  className,
  relative = false,
  mode = "datetime",
}: TimestampDisplayProps) {
  if (!iso) return <span className={cn("text-xs text-muted-foreground", className)}>—</span>;

  const d = new Date(iso);
  if (isNaN(d.getTime())) {
    return <span className={cn("text-xs text-muted-foreground", className)}>—</span>;
  }

  const dateStr = d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  let relativeStr = "";
  if (diffSec < 10) relativeStr = "just now";
  else if (diffSec < 60) relativeStr = `${diffSec}s ago`;
  else if (diffMin < 60) relativeStr = `${diffMin}m ago`;
  else if (diffHr < 24) relativeStr = `${diffHr}h ago`;
  else if (diffDay < 7) relativeStr = `${diffDay}d ago`;
  else relativeStr = dateStr;

  if (mode === "relative" || (relative && mode !== "datetime" && mode !== "both")) {
    return (
      <span
        title={`${dateStr} at ${timeStr}`}
        className={cn("text-xs text-muted-foreground", className)}
      >
        {relativeStr}
      </span>
    );
  }

  if (mode === "time") {
    return (
      <span
        title={`${dateStr} at ${timeStr}`}
        className={cn("text-xs text-muted-foreground font-mono", className)}
      >
        {timeStr}
      </span>
    );
  }

  if (mode === "date") {
    return (
      <span
        title={`${dateStr} at ${timeStr}`}
        className={cn("text-xs text-muted-foreground font-mono", className)}
      >
        {dateStr}
      </span>
    );
  }

  if (mode === "both") {
    return (
      <span
        title={relativeStr}
        className={cn("text-xs text-muted-foreground font-mono", className)}
      >
        {dateStr} • {timeStr}{" "}
        <span className="opacity-70 text-[11px]">({relativeStr})</span>
      </span>
    );
  }

  // default: datetime
  return (
    <span
      title={relativeStr}
      className={cn("text-xs text-muted-foreground font-mono", className)}
    >
      {dateStr} • {timeStr}
    </span>
  );
}
