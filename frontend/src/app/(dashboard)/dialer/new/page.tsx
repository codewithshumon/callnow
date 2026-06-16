"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload, Check, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { postForm, get, extractApiError } from "@/lib/api";
import Papa from "papaparse";
import type { PhoneNumber, CsvValidationReport } from "@/lib/types";

// A simple E.164-ish validation
function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(phone.replace(/[\s\-()]/g, ""));
}

type Step = 1 | 2 | 3 | 4;
interface CampaignConfig {
  fromNumber: string;
  concurrency: number;
  delaySeconds: number;
  retryMax: number;
  callingHoursStart: string;
  callingHoursEnd: string;
  callingHoursTimezone: string;
  voicemailDrop?: File;
  scheduledAt: string;
}

export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const [validation, setValidation] = useState<CsvValidationReport | null>(null);
  const [parsing, setParsing] = useState(false);
  const [userNumbers, setUserNumbers] = useState<PhoneNumber[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [config, setConfig] = useState<CampaignConfig>({
    fromNumber: "", concurrency: 3, delaySeconds: 2, retryMax: 1,
    callingHoursStart: "09:00", callingHoursEnd: "17:00", callingHoursTimezone: "America/New_York",
    scheduledAt: "",
  });

  // Fetch user numbers on mount
  useEffect(() => {
    get<PhoneNumber[]>("/numbers").then((r) => {
      const nums = (r.data as any) || [];
      setUserNumbers(nums);
      const first = nums.find((n: PhoneNumber) => n.capabilities.voice);
      if (first) setConfig((c) => ({ ...c, fromNumber: first.number }));
    }).catch(() => {});
  }, []);

  const voiceNumbers = userNumbers.filter((n) => n.capabilities.voice && n.status === "active");

  // ── CSV parsing + validation ──────────────────────────
  const handleFile = useCallback((file: File) => {
    setCsvFile(file);
    setParsing(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const data = results.data as Record<string, string>[];
        // Identify phone column (case-insensitive)
        const phoneCol = headers.find((h) => h.toLowerCase() === "phone");
        const preview = data.slice(0, 5).map((r) => headers.map((h) => r[h] || ""));
        setCsvPreview(preview);

        // Validate
        const report: CsvValidationReport = { total: data.length, valid: 0, invalid: 0, dncSkipped: 0, invalidRows: [] };
        if (!phoneCol) {
          report.invalid = data.length;
          report.invalidRows = data.map((_, i) => ({ row: i + 2, phone: "N/A", reason: "No 'phone' column found" }));
        } else {
          data.forEach((row, i) => {
            const phone = (row[phoneCol] || "").trim();
            if (!phone) {
              report.invalid++; report.invalidRows.push({ row: i + 2, phone, reason: "Empty phone number" });
            } else if (!isValidE164(phone)) {
              report.invalid++; report.invalidRows.push({ row: i + 2, phone, reason: "Invalid E.164 format" });
            } else {
              report.valid++;
            }
          });
        }
        setValidation(report);
        setParsing(false);
      },
      error: () => { toast.error("Failed to parse CSV"); setParsing(false); },
    });
  }, []);

  // ── Submit ────────────────────────────────────────────
  async function handleSubmit() {
    if (!csvFile || !name) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("fromNumber", config.fromNumber);
      fd.append("concurrency", String(config.concurrency));
      fd.append("delaySeconds", String(config.delaySeconds));
      fd.append("retryMax", String(config.retryMax));
      fd.append("callingHoursStart", config.callingHoursStart);
      fd.append("callingHoursEnd", config.callingHoursEnd);
      fd.append("callingHoursTimezone", config.callingHoursTimezone);
      if (config.scheduledAt) fd.append("scheduledAt", config.scheduledAt);
      if (config.voicemailDrop) fd.append("voicemailDrop", config.voicemailDrop);
      fd.append("contacts", csvFile);
      await postForm("/campaigns", fd);
      toast.success("Campaign created!");
      router.push("/dialer");
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  }

  const steps = ["Name", "Upload CSV", "Settings", "Review"];
  const canNext = (step === 1 && name.trim()) || (step === 2 && validation && validation.valid > 0) || step === 3;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${i + 1 <= step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {i + 1 < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`text-sm ${i + 1 <= step ? "font-medium" : "text-muted-foreground"}`}>{s}</span>
            {i < 3 && <div className="flex-1 h-px bg-border mx-2" />}
          </div>
        ))}
      </div>

      {/* Step 1: Name */}
      {step === 1 && (
        <div className="space-y-4">
          <Label htmlFor="campaign-name">Campaign Name</Label>
          <Input id="campaign-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. January Leads" autoFocus />
        </div>
      )}

      {/* Step 2: CSV Upload */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="rounded-lg border-2 border-dashed p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.name.endsWith(".csv")) handleFile(f); else toast.error("Only .csv files accepted"); }}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => document.getElementById("csv-upload")?.click()}
          >
            <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm">Drag & drop a CSV file or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">Accepted: .csv only · Max 50MB · Required column: phone</p>
            <input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          </div>

          {parsing && <p className="text-sm text-muted-foreground text-center"><Loader2 className="inline h-4 w-4 animate-spin mr-1" />Parsing...</p>}

          {csvFile && !parsing && (
            <p className="text-sm">File: <strong>{csvFile.name}</strong> ({(csvFile.size / 1024).toFixed(1)} KB)</p>
          )}

          {validation && (
            <Card className="p-4 space-y-2">
              <p className="text-sm font-medium">Validation Report</p>
              <div className="flex gap-4 text-sm">
                <Badge variant="default">{validation.total} total</Badge>
                <Badge variant="outline" className="text-green-600">{validation.valid} valid</Badge>
                <Badge variant="destructive">{validation.invalid} invalid</Badge>
              </div>
              {validation.invalidRows.length > 0 && (
                <div className="max-h-40 overflow-auto text-xs space-y-1 mt-2">
                  {validation.invalidRows.map((r, i) => (
                    <p key={i} className="text-muted-foreground">Row {r.row}: &quot;{r.phone}&quot; — {r.reason}</p>
                  ))}
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* Step 3: Settings */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>Calling Number</Label>
            <Select value={config.fromNumber} onValueChange={(v) => setConfig({ ...config, fromNumber: v ?? "" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{voiceNumbers.map((n) => <SelectItem key={n.id} value={n.number}>{n.number}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Concurrency ({config.concurrency})</Label>
            <Slider value={[config.concurrency]} onValueChange={(v) => setConfig({ ...config, concurrency: Array.isArray(v) ? v[0] : v })} min={1} max={10} step={1} />
          </div>
          <div className="space-y-2">
            <Label>Delay between calls ({config.delaySeconds}s)</Label>
            <Slider value={[config.delaySeconds]} onValueChange={(v) => setConfig({ ...config, delaySeconds: Array.isArray(v) ? v[0] : v })} min={0} max={60} step={1} />
          </div>
          <div className="space-y-2">
            <Label>Retry attempts ({config.retryMax})</Label>
            <Slider value={[config.retryMax]} onValueChange={(v) => setConfig({ ...config, retryMax: Array.isArray(v) ? v[0] : v })} min={0} max={3} step={1} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Start time</Label>
              <Input type="time" value={config.callingHoursStart} onChange={(e) => setConfig({ ...config, callingHoursStart: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>End time</Label>
              <Input type="time" value={config.callingHoursEnd} onChange={(e) => setConfig({ ...config, callingHoursEnd: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Input value={config.callingHoursTimezone} onChange={(e) => setConfig({ ...config, callingHoursTimezone: e.target.value })} placeholder="America/New_York" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Label>Start now</Label>
            <Switch checked={!config.scheduledAt} onCheckedChange={(v) => setConfig({ ...config, scheduledAt: v ? "" : new Date(Date.now() + 3600000).toISOString() })} />
            {config.scheduledAt && <Input type="datetime-local" value={config.scheduledAt.slice(0, 16)} onChange={(e) => setConfig({ ...config, scheduledAt: new Date(e.target.value).toISOString() })} />}
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <Card className="p-4 space-y-2 text-sm">
          <p><strong>Name:</strong> {name}</p>
          <p><strong>File:</strong> {csvFile?.name} ({validation?.total} contacts, {validation?.valid} valid)</p>
          <p><strong>From:</strong> {config.fromNumber}</p>
          <p><strong>Concurrency:</strong> {config.concurrency} · <strong>Delay:</strong> {config.delaySeconds}s · <strong>Retry:</strong> {config.retryMax}</p>
          <p><strong>Hours:</strong> {config.callingHoursStart}–{config.callingHoursEnd} ({config.callingHoursTimezone})</p>
          <p><strong>Schedule:</strong> {config.scheduledAt ? new Date(config.scheduledAt).toLocaleString() : "Start now"}</p>
          <Button className="w-full mt-4" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Start Campaign
          </Button>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={() => step > 1 ? setStep((s) => (s - 1) as Step) : router.push("/dialer")} disabled={submitting}>
          <ArrowLeft className="mr-1 h-4 w-4" /> {step === 1 ? "Cancel" : "Back"}
        </Button>
        {step < 4 && (
          <Button onClick={() => setStep((s) => (s + 1) as Step)} disabled={!canNext || submitting}>
            Next <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
