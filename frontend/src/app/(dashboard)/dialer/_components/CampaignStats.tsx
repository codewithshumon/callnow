import { Card, CardContent } from "@/components/ui/card";

interface Props { total: number; dialed: number; answered: number; failed: number; busy: number; remaining: number; }

export default function CampaignStats({ total, dialed, answered, failed, busy, remaining }: Props) {
  const stats = [
    { label: "Total", value: total }, { label: "Dialed", value: dialed },
    { label: "Answered", value: answered }, { label: "Failed", value: failed },
    { label: "Busy", value: busy }, { label: "Remaining", value: remaining },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
