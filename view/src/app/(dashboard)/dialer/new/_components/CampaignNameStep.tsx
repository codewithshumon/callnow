import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props { value: string; onChange: (v: string) => void; }

export default function CampaignNameStep({ value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <Label htmlFor="campaign-name">Campaign Name</Label>
      <Input id="campaign-name" value={value} onChange={(e) => onChange(e.target.value)} placeholder="e.g. January Leads" autoFocus />
    </div>
  );
}
