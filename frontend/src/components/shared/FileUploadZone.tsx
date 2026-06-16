"use client";

import { useState } from "react";
import { Upload, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadZoneProps {
  accept: string;
  maxSizeMB: number;
  onFile: (file: File) => void;
  error?: string;
  label?: string;
}

export default function FileUploadZone({
  accept, maxSizeMB, onFile, error, label,
}: FileUploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");

  function validate(file: File): boolean {
    const ext = file.name.split(".").pop()?.toLowerCase();
    const accepted = accept.split(",").map((a) => a.trim().replace(".", ""));
    if (ext && !accepted.includes(ext)) {
      return false;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return false;
    }
    return true;
  }

  function handleFile(file: File) {
    if (!validate(file)) return;
    setFileName(file.name);
    onFile(file);
  }

  return (
    <div>
      <div
        className={cn(
          "rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
          error && "border-destructive"
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onClick={() => document.getElementById("fu-zone")?.click()}
      >
        <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
        <p className="text-sm">{label || "Drag & drop or click to browse"}</p>
        <p className="text-xs text-muted-foreground mt-1">
          Accepted: {accept} · Max {maxSizeMB}MB
        </p>
        <input id="fu-zone" type="file" accept={accept} className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      </div>
      {fileName && <p className="mt-2 text-xs text-muted-foreground">Selected: {fileName}</p>}
      {error && (
        <p className="mt-2 flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" /> {error}
        </p>
      )}
    </div>
  );
}
