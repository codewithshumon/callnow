import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { CsvValidationReport } from "@/lib/types";

interface CampaignConfig {
  fromNumber: string; concurrency: number; delaySeconds: number; retryMax: number;
  callingHoursStart: string; callingHoursEnd: string; callingHoursTimezone: string; scheduledAt: string;
}

interface Props {
  name: string; config: CampaignConfig; validation: CsvValidationReport | null;
  fileName?: string; onSubmit: () => void; submitting: boolean;
}

export default function CampaignReviewStep({ name, config, validation, fileName, onSubmit, submitting }: Props) {
  return (
    <Card className="p-4 space-y-2 text-sm">
      <p><strong>Name:</strong> {name}</p>
      <p><strong>File:</strong> {fileName || "—"} ({validation?.total || 0} contacts, {validation?.valid || 0} valid)</p>
      <p><strong>From:</strong> {config.fromNumber}</p>
      <p><strong>Concurrency:</strong> {config.concurrency} · <strong>Delay:</strong> {config.delaySeconds}s · <strong>Retry:</strong> {config.retryMax}</p>
      <p><strong>Hours:</strong> {config.callingHoursStart}–{config.callingHoursEnd} ({config.callingHoursTimezone})</p>
      <p><strong>Schedule:</strong> {config.scheduledAt ? new Date(config.scheduledAt).toLocaleString() : "Start immediately"}</p>
      <Button className="w-full mt-4" onClick={onSubmit} disabled={submitting}>
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Start Campaign
      </Button>
    </Card>
  );
}
