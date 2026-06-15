import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CapabilityBadgeProps {
  capability: string;
  enabled: boolean;
  size?: "sm" | "md";
}

export default function CapabilityBadge({ capability, enabled, size = "sm" }: CapabilityBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1",
        size === "sm" && "text-[10px]",
        size === "md" && "text-xs",
        !enabled && "text-muted-foreground opacity-50"
      )}
    >
      {enabled ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      {capability} {enabled ? "✓" : "✗"}
    </Badge>
  );
}
