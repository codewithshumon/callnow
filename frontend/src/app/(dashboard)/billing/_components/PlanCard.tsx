import { CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Props { planName: string; period?: { start: string; end: string }; onUpgrade: () => void; onDowngrade?: () => void; }

export default function PlanCard({ planName, period, onUpgrade, onDowngrade }: Props) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            {planName} Plan
          </CardTitle>
          <div className="flex gap-2">
            {onDowngrade && <Button variant="outline" size="sm" onClick={onDowngrade}>Downgrade</Button>}
            <Button variant="outline" size="sm" onClick={onUpgrade}>Upgrade</Button>
          </div>
        </div>
      </CardHeader>
      {period && (
        <CardContent className="text-sm text-muted-foreground">
          Period: {period.start} → {period.end}
        </CardContent>
      )}
    </Card>
  );
}
