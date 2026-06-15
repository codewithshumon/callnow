import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { CsvValidationReport } from "@/lib/types";

interface Props { report: CsvValidationReport; }

export default function CsvValidationReportView({ report }: Props) {
  function downloadInvalid() {
    const csv = "row,phone,reason\n" + report.invalidRows.map((r) => `${r.row},"${r.phone}","${r.reason}"`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "invalid-contacts.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card className="p-4 space-y-3">
      <p className="text-sm font-medium">Validation Report</p>
      <div className="flex gap-2 flex-wrap">
        <Badge variant="default">{report.total} total</Badge>
        <Badge variant="outline" className="text-green-600">{report.valid} valid</Badge>
        <Badge variant="destructive">{report.invalid} invalid</Badge>
        {report.dncSkipped > 0 && <Badge variant="outline" className="text-orange-600">{report.dncSkipped} DNC skipped</Badge>}
      </div>
      {report.invalidRows.length > 0 && (
        <>
          <div className="max-h-40 overflow-auto text-xs space-y-1 mt-2">
            {report.invalidRows.slice(0, 20).map((r, i) => (
              <p key={i} className="text-muted-foreground">Row {r.row}: &quot;{r.phone}&quot; — {r.reason}</p>
            ))}
            {report.invalidRows.length > 20 && <p className="text-muted-foreground">...and {report.invalidRows.length - 20} more</p>}
          </div>
          <Button variant="outline" size="sm" onClick={downloadInvalid}>
            <Download className="mr-1 h-3 w-3" /> Download invalid rows as CSV
          </Button>
        </>
      )}
    </Card>
  );
}
