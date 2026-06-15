"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import FileUploadZone from "@/components/shared/FileUploadZone";
import type { CsvValidationReport } from "@/lib/types";
import Papa from "papaparse";

function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone.replace(/[\s\-()]/g, ""));
}

interface Props { onFileParsed: (file: File, report: CsvValidationReport, preview: string[][]) => void; }

export default function CsvUploadStep({ onFileParsed }: Props) {
  const [parsing, setParsing] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);

  function handleFile(file: File) {
    setFileName(file.name);
    setFileSize(file.size);
    setParsing(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const data = results.data as Record<string, string>[];
        const phoneCol = headers.find((h) => h.toLowerCase() === "phone");
        const preview = data.slice(0, 5).map((r) => headers.map((h) => r[h] || ""));

        const report: CsvValidationReport = { total: data.length, valid: 0, invalid: 0, dncSkipped: 0, invalidRows: [] };
        if (!phoneCol) {
          report.invalid = data.length;
          report.invalidRows = data.map((_, i) => ({ row: i + 2, phone: "N/A", reason: "No 'phone' column found" }));
        } else {
          data.forEach((row, i) => {
            const phone = (row[phoneCol] || "").trim();
            if (!phone) { report.invalid++; report.invalidRows.push({ row: i + 2, phone, reason: "Empty" }); }
            else if (!isValidE164(phone)) { report.invalid++; report.invalidRows.push({ row: i + 2, phone, reason: "Invalid E.164 format" }); }
            else { report.valid++; }
          });
        }
        onFileParsed(file, report, preview);
        setParsing(false);
      },
      error: () => { toast.error("Failed to parse CSV"); setParsing(false); },
    });
  }

  return (
    <div className="space-y-4">
      <FileUploadZone accept=".csv" maxSizeMB={50} onFile={handleFile} label="Drag & drop a CSV file or click to browse" />
      {parsing && <p className="text-sm text-muted-foreground text-center"><Loader2 className="inline h-4 w-4 animate-spin mr-1" />Parsing...</p>}
      {fileName && !parsing && <p className="text-sm">File: <strong>{fileName}</strong> ({(fileSize / 1024).toFixed(1)} KB)</p>}
    </div>
  );
}
