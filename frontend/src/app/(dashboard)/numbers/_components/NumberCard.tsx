import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CapabilityBadge from "@/components/shared/CapabilityBadge";
import ProviderBadge from "@/components/shared/ProviderBadge";
import type { PhoneNumber } from "@/lib/types";

interface Props { number: PhoneNumber; onRelease: (id: string) => void; releasing: string | null; }

export default function NumberCard({ number: num, onRelease, releasing }: Props) {
  return (
    <Card className={num.status !== "active" ? "opacity-60" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-lg font-mono font-medium">{num.number}</p>
            {num.friendlyName && <p className="text-sm text-muted-foreground">{num.friendlyName}</p>}
          </div>
          <Badge variant={num.status === "active" ? "default" : "secondary"} className="text-[10px]">{num.status}</Badge>
        </div>
        <div className="flex items-center gap-1 mt-2">
          <CapabilityBadge capability="Voice" enabled={num.capabilities.voice} />
          <CapabilityBadge capability="SMS" enabled={num.capabilities.sms} />
          <CapabilityBadge capability="MMS" enabled={num.capabilities.mms} />
        </div>
        <div className="flex items-center justify-between mt-3">
          <ProviderBadge provider={num.provider} />
          <span className="text-xs text-muted-foreground">${num.monthlyCost}/mo</span>
          {num.status === "active" && (
            <Button variant="ghost" size="sm" onClick={() => onRelease(num.id)} disabled={releasing === num.id} className="text-destructive hover:text-destructive h-auto p-1">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
