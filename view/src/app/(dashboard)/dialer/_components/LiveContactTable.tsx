import StatusBadge from "@/components/shared/StatusBadge";
import type { CampaignContact } from "@/lib/types";

interface Props { contacts: CampaignContact[]; }

export default function LiveContactTable({ contacts }: Props) {
  if (!contacts?.length) return <p className="text-sm text-muted-foreground py-4 text-center">Waiting for activity...</p>;

  return (
    <div className="overflow-auto max-h-64 rounded-lg border">
      <table className="w-full text-sm">
        <thead><tr className="border-b bg-muted/50"><th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Phone</th><th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Name</th><th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Status</th></tr></thead>
        <tbody>
          {contacts.slice(0, 50).map((c) => (
            <tr key={c.id} className="border-b last:border-0">
              <td className="px-3 py-2 font-mono text-xs">{c.phone}</td>
              <td className="px-3 py-2 text-xs">{c.name || "—"}</td>
              <td className="px-3 py-2"><StatusBadge status={c.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
