import { cn } from "@/lib/utils";

interface CharCounterProps { current: number; max: number; className?: string; }

export default function CharCounter({ current, max, className }: CharCounterProps) {
  const pct = (current / max) * 100;
  return (
    <p className={cn("text-right text-xs", pct >= 90 ? "text-destructive" : "text-muted-foreground", className)}>
      {current}/{max} {pct >= 100 && "(max)"}
    </p>
  );
}
