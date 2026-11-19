"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Upload,
  Check,
  ArrowLeft,
  ArrowRight,
  Loader2,
  FileSpreadsheet,
  Phone,
  Clock,
  ShieldCheck,
  Calendar,
  Layers,
  AlertCircle,
  CheckCircle2,
  Sliders,
  HelpCircle,
  FileText,
  Rocket,
  Download,
  X,
  Radio,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { postForm, get, extractApiError } from "@/lib/api";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import Papa from "papaparse";
import { cn } from "@/lib/utils";
import type { PhoneNumber, CsvValidationReport } from "@/lib/types";

function isValidE164(phone: string): boolean {
  if (!phone) return false;
  try {
    const parsed = parsePhoneNumberFromString(phone);
    return !!parsed && parsed.isValid();
  } catch {
    return /^\+[1-9]\d{6,14}$/.test(phone.replace(/[\s\-()]/g, ""));
  }
}

function formatPhone(num: string) {
  if (!num) return "";
  try {
    const parsed = parsePhoneNumberFromString(num);
    return parsed ? parsed.formatInternational() : num;
  } catch {
    return num;
  }
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

const WIZARD_STEPS = [
  { step: 1, title: "Campaign Name", desc: "Identify your campaign" },
  { step: 2, title: "Lead List (CSV)", desc: "Upload and validate phone numbers" },
  { step: 3, title: "Telephony & Pacing", desc: "Channels, speed & call hours" },
  { step: 4, title: "Review & Launch", desc: "Verify settings and start" },
];

export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvPreviewRows, setCsvPreviewRows] = useState<Record<string, string>[]>([]);
  const [validation, setValidation] = useState<CsvValidationReport | null>(null);
  const [parsing, setParsing] = useState(false);
  const [userNumbers, setUserNumbers] = useState<PhoneNumber[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const [config, setConfig] = useState<CampaignConfig>({
    fromNumber: "",
    concurrency: 3,
    delaySeconds: 2,
    retryMax: 1,
    callingHoursStart: "09:00",
    callingHoursEnd: "17:00",
    callingHoursTimezone: "America/New_York",
    scheduledAt: "",
  });

  // Fetch user numbers on mount
  useEffect(() => {
    get<PhoneNumber[]>("/numbers")
      .then((r) => {
        const nums = (r.data as any) || [];
        setUserNumbers(nums);
        const firstVoice = nums.find(
          (n: PhoneNumber) => n.capabilities.voice && n.status === "active"
        );
        if (firstVoice) {
          setConfig((c) => ({ ...c, fromNumber: firstVoice.number }));
        }
      })
      .catch(() => {});
  }, []);

  const voiceNumbers = useMemo(
    () => userNumbers.filter((n) => n.capabilities.voice && n.status === "active"),
    [userNumbers]
  );

  // CSV parsing & verification
  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a .csv file");
      return;
    }
    setCsvFile(file);
    setParsing(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        setCsvHeaders(headers);
        const data = results.data as Record<string, string>[];
        setCsvPreviewRows(data.slice(0, 5));

        const phoneCol = headers.find(
          (h) =>
            h.toLowerCase() === "phone" ||
            h.toLowerCase() === "phonenumber" ||
            h.toLowerCase() === "mobile" ||
            h.toLowerCase() === "number"
        );

        const report: CsvValidationReport = {
          total: data.length,
          valid: 0,
          invalid: 0,
          dncSkipped: 0,
          invalidRows: [],
        };

        if (!phoneCol) {
          report.invalid = data.length;
          report.invalidRows = data.map((_, i) => ({
            row: i + 2,
            phone: "N/A",
            reason: "No 'phone' or 'mobile' header detected",
          }));
        } else {
          data.forEach((row, i) => {
            const rawPhone = (row[phoneCol] || "").trim();
            if (!rawPhone) {
              report.invalid++;
              report.invalidRows.push({
                row: i + 2,
                phone: rawPhone || "—",
                reason: "Empty phone field",
              });
            } else if (!isValidE164(rawPhone)) {
              report.invalid++;
              report.invalidRows.push({
                row: i + 2,
                phone: rawPhone,
                reason: "Invalid international format (E.164 required, e.g. +14155551234)",
              });
            } else {
              report.valid++;
            }
          });
        }

        setValidation(report);
        setParsing(false);
        if (report.valid > 0) {
          toast.success(`Validated ${report.valid} callable leads from ${file.name}`);
        } else {
          toast.error("No valid E.164 phone numbers found in this CSV");
        }
      },
      error: () => {
        toast.error("Failed to parse CSV file");
        setParsing(false);
      },
    });
  }, []);

  // Download Sample CSV Helper
  const downloadSampleCsv = () => {
    const content = "name,phone,notes\nJohn Doe,+14155551234,Interested in pro plan\nJane Smith,+12125559876,Follow-up call";
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sample-leads-template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submission
  async function handleSubmit() {
    if (!csvFile || !name.trim()) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
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
      toast.success("Campaign created successfully and queued for dialing!");
      router.push("/dialer");
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  }

  const canNext = useMemo(() => {
    if (step === 1) return name.trim().length >= 2;
    if (step === 2) return !parsing && validation && validation.valid > 0;
    if (step === 3) return !!config.fromNumber;
    return true;
  }, [step, name, parsing, validation, config.fromNumber]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full min-w-0 space-y-8">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link
              href="/dialer"
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Campaigns
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">New Campaign</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Create Outbound Campaign
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Set up an automated high-velocity power dialer campaign with CSV lead ingestion.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dialer")}
            className="text-xs"
          >
            Cancel
          </Button>
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {WIZARD_STEPS.map((s) => {
          const isDone = s.step < step;
          const isCurrent = s.step === step;

          return (
            <div
              key={s.step}
              onClick={() => {
                if (s.step < step) setStep(s.step as Step);
              }}
              className={cn(
                "rounded-2xl border p-4 transition-all select-none",
                isCurrent
                  ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary/20"
                  : isDone
                  ? "border-border/80 bg-muted/20 cursor-pointer hover:bg-muted/40"
                  : "border-border/60 opacity-60"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold transition-all",
                    isCurrent
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : isDone
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {isDone ? <Check className="h-4 w-4" /> : s.step}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate leading-tight text-foreground">
                    {s.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                    {s.desc}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Step Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left / Main: Step Form Canvas */}
        <div className="lg:col-span-8 space-y-6">
          {/* STEP 1: CAMPAIGN NAME & DETAILS */}
          {step === 1 && (
            <Card className="border border-border/80 shadow-2xs bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" /> Step 1: Campaign Details
                </CardTitle>
                <CardDescription className="text-xs">
                  Give your calling campaign a clear, identifiable name.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="campaign-name" className="text-xs font-semibold">
                    Campaign Name *
                  </Label>
                  <Input
                    id="campaign-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Q1 Enterprise Outreach, Real Estate Inbound Callbacks"
                    className="h-11 text-sm rounded-xl"
                    autoFocus
                  />
                  <p className="text-[11px] text-muted-foreground">
                    This will appear in your campaign logs, export files, and live dialer dashboard.
                  </p>
                </div>

                <div className="rounded-xl border border-border/70 bg-muted/20 p-4 space-y-2">
                  <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" /> Best Practices for Outbound Calling
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Group leads by geographic timezone to comply with legal calling hours.</li>
                    <li>Always provide a registered caller ID line with active 2-way voice capability.</li>
                    <li>Ensure telephone numbers in your CSV are in international E.164 format.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 2: LEAD LIST UPLOAD & VALIDATION */}
          {step === 2 && (
            <Card className="border border-border/80 shadow-2xs bg-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileSpreadsheet className="h-5 w-5 text-primary" /> Step 2: Upload Contact Leads
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Upload your contact CSV file with recipient phone numbers.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={downloadSampleCsv}
                    className="text-xs gap-1.5"
                  >
                    <Download className="h-3 w-3" /> Sample CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Drag and Drop Zone */}
                <div
                  className={cn(
                    "rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all",
                    isDragOver
                      ? "border-primary bg-primary/5"
                      : "border-border/80 hover:border-primary/50 hover:bg-muted/30"
                  )}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    const file = e.dataTransfer.files[0];
                    if (file) handleFile(file);
                  }}
                  onClick={() => document.getElementById("csv-file-input")?.click()}
                >
                  <Upload className="mx-auto h-12 w-12 text-primary/70 mb-3" />
                  <p className="text-sm font-semibold">
                    {csvFile ? csvFile.name : "Click to browse or drag & drop contact list"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Accepts standard CSV file (.csv) up to 50MB. Required column:{" "}
                    <span className="font-mono font-medium text-foreground">phone</span> or{" "}
                    <span className="font-mono font-medium text-foreground">mobile</span>.
                  </p>
                  <input
                    id="csv-file-input"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFile(file);
                    }}
                  />
                </div>

                {parsing && (
                  <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span>Parsing and verifying phone numbers...</span>
                  </div>
                )}

                {/* Validation Report */}
                {validation && (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-center">
                        <span className="text-[10px] uppercase font-semibold text-muted-foreground">
                          Total Rows
                        </span>
                        <p className="text-xl font-bold font-mono">{validation.total}</p>
                      </div>

                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
                        <span className="text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-400">
                          Callable (Valid E.164)
                        </span>
                        <p className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          {validation.valid}
                        </p>
                      </div>

                      <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-center">
                        <span className="text-[10px] uppercase font-semibold text-rose-600 dark:text-rose-400">
                          Invalid / Skipped
                        </span>
                        <p className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
                          {validation.invalid}
                        </p>
                      </div>
                    </div>

                    {/* Invalid Rows Warning Drawer */}
                    {validation.invalidRows.length > 0 && (
                      <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3.5 space-y-2">
                        <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                          <AlertCircle className="h-4 w-4" /> Rows requiring attention (will be skipped during dialing):
                        </span>
                        <div className="max-h-32 overflow-y-auto space-y-1 font-mono text-[11px] pr-2">
                          {validation.invalidRows.slice(0, 15).map((r, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between text-muted-foreground border-b border-border/40 pb-1"
                            >
                              <span>Row #{r.row}: &quot;{r.phone}&quot;</span>
                              <span className="text-rose-500">{r.reason}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Preview Table */}
                    {csvPreviewRows.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-xs font-semibold text-muted-foreground">
                          Sample Lead Preview (First 5 Rows):
                        </span>
                        <div className="rounded-xl border border-border/70 overflow-x-auto text-xs">
                          <table className="w-full divide-y divide-border/60">
                            <thead className="bg-muted/40 font-semibold text-left">
                              <tr>
                                {csvHeaders.map((h) => (
                                  <th key={h} className="p-2.5">
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40 font-mono text-[11px]">
                              {csvPreviewRows.map((row, i) => (
                                <tr key={i} className="hover:bg-muted/20">
                                  {csvHeaders.map((h) => (
                                    <td key={h} className="p-2.5 truncate max-w-[150px]">
                                      {row[h] || "—"}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* STEP 3: TELEPHONY & PACING PARAMETERS */}
          {step === 3 && (
            <Card className="border border-border/80 shadow-2xs bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-primary" /> Step 3: Dialing Engine & Pacing
                </CardTitle>
                <CardDescription className="text-xs">
                  Configure outbound caller identity, call concurrency, retry strategy, and legal operating hours.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Caller ID Line */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold">
                      Outbound Caller ID Line (From) *
                    </Label>
                    <span className="text-[11px] text-muted-foreground">
                      {voiceNumbers.length} voice line{voiceNumbers.length > 1 ? "s" : ""} available
                    </span>
                  </div>

                  {voiceNumbers.length === 0 ? (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive flex items-center justify-between">
                      <span>No active voice number found. You must buy or provision a number before dialing.</span>
                      <Link
                        href="/numbers"
                        className={cn(buttonVariants({ variant: "outline", size: "xs" }))}
                      >
                        Buy Number
                      </Link>
                    </div>
                  ) : (
                    <Select
                      value={config.fromNumber}
                      onValueChange={(v) => setConfig({ ...config, fromNumber: v ?? "" })}
                    >
                      <SelectTrigger className="h-10 text-xs font-mono">
                        <SelectValue placeholder="Select Caller ID number..." />
                      </SelectTrigger>
                      <SelectContent>
                        {voiceNumbers.map((n) => (
                          <SelectItem key={n.id} value={n.number} className="font-mono text-xs">
                            {formatPhone(n.number)} ({n.friendlyName || n.provider})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Concurrency slider */}
                <div className="space-y-3 rounded-xl border border-border/70 p-4 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-semibold">
                        Dialing Concurrency Channels
                      </Label>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Number of simultaneous calls placed in parallel.
                      </p>
                    </div>
                    <Badge variant="default" className="text-xs font-mono px-2.5 py-0.5">
                      {config.concurrency} channels
                    </Badge>
                  </div>
                  <Slider
                    value={[config.concurrency]}
                    onValueChange={(v) =>
                      setConfig({ ...config, concurrency: Array.isArray(v) ? v[0] : v })
                    }
                    min={1}
                    max={10}
                    step={1}
                    className="py-1"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
                    <span>1 channel (Paced)</span>
                    <span>5 channels (Recommended)</span>
                    <span>10 channels (Blast)</span>
                  </div>
                </div>

                {/* Delay & Retry Strategy */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 rounded-xl border border-border/70 p-3.5 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">Delay Between Calls</Label>
                      <span className="font-mono text-xs font-bold text-primary">
                        {config.delaySeconds}s
                      </span>
                    </div>
                    <Slider
                      value={[config.delaySeconds]}
                      onValueChange={(v) =>
                        setConfig({ ...config, delaySeconds: Array.isArray(v) ? v[0] : v })
                      }
                      min={0}
                      max={30}
                      step={1}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Pause duration before dialing the next batch of leads.
                    </p>
                  </div>

                  <div className="space-y-2 rounded-xl border border-border/70 p-3.5 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">Max Retry Attempts</Label>
                      <span className="font-mono text-xs font-bold text-primary">
                        {config.retryMax} attempt{config.retryMax > 1 ? "s" : ""}
                      </span>
                    </div>
                    <Slider
                      value={[config.retryMax]}
                      onValueChange={(v) =>
                        setConfig({ ...config, retryMax: Array.isArray(v) ? v[0] : v })
                      }
                      min={0}
                      max={3}
                      step={1}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Auto-retry unanswered or busy contacts up to N times.
                    </p>
                  </div>
                </div>

                {/* Operating Window & Compliance */}
                <div className="space-y-3 rounded-xl border border-border/70 p-4 bg-muted/20">
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    <Clock className="h-4 w-4 text-primary" /> Daily Calling Window & Legal Hours
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Start Time</Label>
                      <Input
                        type="time"
                        value={config.callingHoursStart}
                        onChange={(e) =>
                          setConfig({ ...config, callingHoursStart: e.target.value })
                        }
                        className="text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">End Time</Label>
                      <Input
                        type="time"
                        value={config.callingHoursEnd}
                        onChange={(e) =>
                          setConfig({ ...config, callingHoursEnd: e.target.value })
                        }
                        className="text-xs h-9"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Target Timezone</Label>
                      <Input
                        value={config.callingHoursTimezone}
                        onChange={(e) =>
                          setConfig({ ...config, callingHoursTimezone: e.target.value })
                        }
                        placeholder="America/New_York"
                        className="text-xs h-9"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Dialing automatically pauses outside of this window to respect TCPA / regional calling laws.
                  </p>
                </div>

                {/* Scheduling */}
                <div className="flex items-center justify-between rounded-xl border border-border/70 p-4 bg-muted/20">
                  <div>
                    <Label className="text-xs font-semibold">Launch Schedule</Label>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {config.scheduledAt
                        ? `Scheduled to launch on ${new Date(config.scheduledAt).toLocaleString()}`
                        : "Start dialing immediately once created"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium">
                      {config.scheduledAt ? "Scheduled" : "Immediate"}
                    </span>
                    <Switch
                      checked={!config.scheduledAt}
                      onCheckedChange={(checked) =>
                        setConfig({
                          ...config,
                          scheduledAt: checked
                            ? ""
                            : new Date(Date.now() + 3600000).toISOString(),
                        })
                      }
                    />
                  </div>
                </div>

                {config.scheduledAt && (
                  <div className="space-y-1.5 pl-1">
                    <Label className="text-xs">Select Start Date & Time</Label>
                    <Input
                      type="datetime-local"
                      value={config.scheduledAt.slice(0, 16)}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          scheduledAt: new Date(e.target.value).toISOString(),
                        })
                      }
                      className="text-xs h-9 max-w-sm"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* STEP 4: REVIEW & LAUNCH */}
          {step === 4 && (
            <Card className="border border-border/80 shadow-2xs bg-card">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-primary" /> Step 4: Review & Launch Campaign
                </CardTitle>
                <CardDescription className="text-xs">
                  Verify your campaign parameters before initiating the automated dialer.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-border/70 p-4 bg-muted/20 space-y-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      Campaign Identity
                    </span>
                    <p className="text-base font-bold text-foreground">{name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      Outbound Line: {formatPhone(config.fromNumber)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border/70 p-4 bg-muted/20 space-y-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      Contact Audience
                    </span>
                    <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                      {validation?.valid || 0} Callable Leads
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      Source file: {csvFile?.name} ({(Number(csvFile?.size || 0) / 1024).toFixed(1)} KB)
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-border/70 divide-y divide-border/60 text-xs bg-card">
                  <div className="flex items-center justify-between p-3">
                    <span className="text-muted-foreground">Concurrency Engine</span>
                    <span className="font-semibold">{config.concurrency} channels in parallel</span>
                  </div>
                  <div className="flex items-center justify-between p-3">
                    <span className="text-muted-foreground">Batch Delay</span>
                    <span className="font-semibold">{config.delaySeconds} seconds between calls</span>
                  </div>
                  <div className="flex items-center justify-between p-3">
                    <span className="text-muted-foreground">Retry Attempts</span>
                    <span className="font-semibold">{config.retryMax} retries for unanswered leads</span>
                  </div>
                  <div className="flex items-center justify-between p-3">
                    <span className="text-muted-foreground">Calling Window</span>
                    <span className="font-semibold">
                      {config.callingHoursStart} – {config.callingHoursEnd} ({config.callingHoursTimezone})
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3">
                    <span className="text-muted-foreground">Execution Status</span>
                    <span className="font-semibold font-mono text-primary">
                      {config.scheduledAt
                        ? `Scheduled: ${new Date(config.scheduledAt).toLocaleString()}`
                        : "Ready for immediate execution"}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full h-12 text-sm font-bold shadow-md bg-primary text-primary-foreground gap-2 rounded-xl"
                >
                  {submitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Rocket className="h-5 w-5" />
                  )}
                  <span>{submitting ? "Launching Campaign..." : "Confirm & Launch Campaign"}</span>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (step > 1) setStep((s) => (s - 1) as Step);
                else router.push("/dialer");
              }}
              disabled={submitting}
              className="text-xs h-9 gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{step === 1 ? "Exit Wizard" : "Previous Step"}</span>
            </Button>

            {step < 4 && (
              <Button
                size="sm"
                onClick={() => setStep((s) => (s + 1) as Step)}
                disabled={!canNext || submitting}
                className="text-xs h-9 gap-1.5 bg-primary text-primary-foreground font-semibold"
              >
                <span>Continue to {WIZARD_STEPS[step]?.title}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Right / Sidebar: Real-Time Live Overview Card */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="border border-border/80 shadow-2xs bg-card/60 backdrop-blur-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Radio className="h-4 w-4 text-primary" /> Live Campaign Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase">
                  Campaign Title
                </span>
                <p className="font-semibold text-foreground truncate">
                  {name || <span className="italic text-muted-foreground/60">Untitled Campaign</span>}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase">
                  Audience Size
                </span>
                <p className="font-mono font-semibold text-foreground">
                  {validation ? `${validation.valid} verified leads` : "No CSV uploaded"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase">
                  Caller ID (From)
                </span>
                <p className="font-mono font-semibold text-foreground">
                  {config.fromNumber ? formatPhone(config.fromNumber) : "Not configured"}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase">
                  Throughput
                </span>
                <p className="font-mono text-muted-foreground">
                  {config.concurrency} lines @ {config.delaySeconds}s delay
                </p>
              </div>

              <div className="pt-2 border-t border-border/60">
                <div className="rounded-xl bg-muted/40 p-3 space-y-1">
                  <span className="text-[11px] font-semibold text-primary">Dialer Pipeline</span>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Once launched, the backend worker pools contacts, handles ringing timeouts, and redirects answered calls into your WebRTC browser phone.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
