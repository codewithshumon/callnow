import { Badge } from "@/components/ui/badge";

interface ProviderBadgeProps {
  provider: string;
  size?: "sm" | "md";
}

export default function ProviderBadge({ provider, size = "sm" }: ProviderBadgeProps) {
  return (
    <Badge variant="outline" className={size === "sm" ? "text-[10px]" : "text-xs"}>
      {provider}
    </Badge>
  );
}
