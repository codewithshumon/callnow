import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Invoice } from "@/lib/types";

interface Props { invoices: Invoice[]; }

export default function InvoiceTable({ invoices }: Props) {
  if (invoices.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No invoices yet.</p>;
  }

  return (
    <div className="space-y-2">
      {invoices.map((inv) => (
        <div key={inv.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
          <div>
            <p className="text-sm font-medium">${inv.amount}</p>
            <p className="text-xs text-muted-foreground">{inv.period}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={inv.status === "paid" ? "default" : "secondary"} className="text-[10px]">{inv.status}</Badge>
            {inv.pdfUrl && (
              <a href={inv.pdfUrl} target="_blank" rel="noopener" className="text-primary hover:underline">
                <Download className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
