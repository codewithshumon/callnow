"use client";

import { useState } from "react";
import {
  Search,
  Loader2,
  Globe,
  Phone,
  MessageSquare,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Check,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { get, post, extractApiError } from "@/lib/api";
import type { AvailableNumber } from "@/lib/types";
import { cn } from "@/lib/utils";

const COUNTRIES = [
  { code: "US", name: "United States", flag: "🇺🇸", prefix: "+1" },
  { code: "CA", name: "Canada", flag: "🇨🇦", prefix: "+1" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", prefix: "+44" },
  { code: "AU", name: "Australia", flag: "🇦🇺", prefix: "+61" },
  { code: "IE", name: "Ireland", flag: "🇮🇪", prefix: "+353" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿", prefix: "+64" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", prefix: "+27" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export default function AddNumberDialog({ open, onClose, onAdded }: Props) {
  const [step, setStep] = useState<"search" | "results">("search");
  const [countryCode, setCountryCode] = useState("US");
  const [areaCode, setAreaCode] = useState("");
  const [capVoice, setCapVoice] = useState(true);
  const [capSms, setCapSms] = useState(true);
  const [capMms, setCapMms] = useState(false);
  const [results, setResults] = useState<AvailableNumber[]>([]);
  const [searching, setSearching] = useState(false);
  const [provisioning, setProvisioning] = useState<string | null>(null);

  async function handleSearch() {
    setSearching(true);
    try {
      const caps = [];
      if (capVoice) caps.push("voice");
      if (capSms) caps.push("sms");
      if (capMms) caps.push("mms");
      const params = new URLSearchParams({ countryCode });
      if (areaCode) params.set("areaCode", areaCode);
      if (caps.length) params.set("capabilities", caps.join(","));
      const res = await get<AvailableNumber[]>(`/numbers/search?${params}`);
      setResults((res.data as any) || []);
      setStep("results");
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setSearching(false);
    }
  }

  async function handleProvision(number: string) {
    setProvisioning(number);
    try {
      await post("/numbers", { number });
      toast.success(`Phone line ${number} provisioned successfully!`);
      onAdded();
      resetAndClose();
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setProvisioning(null);
    }
  }

  function resetAndClose() {
    setStep("search");
    setResults([]);
    onClose();
  }

  const selectedCountry = COUNTRIES.find((c) => c.code === countryCode);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetAndClose(); }}>
      <DialogContent className="max-w-lg rounded-3xl p-6 sm:p-7 shadow-2xl border border-border/80">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Globe className="h-4 w-4" />
            </div>
            <DialogTitle className="text-lg font-bold text-foreground">
              {step === "search" ? "Claim New Virtual Number" : "Available Numbers"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {step === "search"
              ? "Search by country, area code, or specific telephony capabilities."
              : `Found ${results.length} numbers ready for instant 1-click provisioning.`}
          </DialogDescription>
        </DialogHeader>

        {step === "search" && (
          <div className="space-y-5 pt-3">
            {/* Country Selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Destination Country</Label>
              <Select value={countryCode} onValueChange={(v) => setCountryCode(v ?? "US")}>
                <SelectTrigger className="h-11 rounded-xl bg-muted/40 border-border/80 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-lg">
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code} className="text-xs sm:text-sm py-2">
                      <span className="mr-2 text-base">{c.flag}</span>
                      <span>{c.name}</span>
                      <span className="ml-2 font-mono text-muted-foreground text-xs">({c.prefix})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Area Code Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Area Code / Prefix (Optional)</Label>
              <Input
                value={areaCode}
                onChange={(e) => setAreaCode(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="e.g. 212 (NYC), 415 (SF), 20 (London)"
                maxLength={6}
                className="h-11 rounded-xl bg-muted/40 border-border/80 text-sm font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Leave blank to search all available nationwide regions.
              </p>
            </div>

            {/* Capabilities selection */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Required Line Capabilities</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setCapVoice(!capVoice)}
                  className={cn(
                    "p-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all",
                    capVoice
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border/80 bg-muted/30 text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Phone className="h-4 w-4" />
                  <span>Voice Calling</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCapSms(!capSms)}
                  className={cn(
                    "p-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all",
                    capSms
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border/80 bg-muted/30 text-muted-foreground hover:bg-muted"
                  )}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Two-Way SMS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCapMms(!capMms)}
                  className={cn(
                    "p-3 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all",
                    capMms
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border/80 bg-muted/30 text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Tag className="h-4 w-4" />
                  <span>MMS Media</span>
                </button>
              </div>
            </div>

            {/* Search Button */}
            <Button
              className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md text-sm gap-2 mt-2"
              onClick={handleSearch}
              disabled={searching}
            >
              {searching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Querying Telecom Registry...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>Search Available Lines</span>
                </>
              )}
            </Button>
          </div>
        )}

        {step === "results" && (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("search")}
                className="h-8 rounded-lg text-xs gap-1.5 -ml-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Refine Search</span>
              </Button>
              <span className="text-xs font-mono text-muted-foreground">
                {selectedCountry?.flag} {selectedCountry?.name}
              </span>
            </div>

            {results.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <p className="text-sm font-semibold text-foreground">No lines available</p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  No numbers matching this prefix were returned by the carrier. Try clearing the area code to see all available national numbers.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {results.map((num) => (
                  <div
                    key={num.number}
                    className="flex items-center justify-between rounded-2xl border border-border/80 bg-card p-3.5 hover:border-primary/50 transition-colors shadow-sm"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-bold font-mono text-foreground tracking-wide">
                        {num.number}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {num.locality ? `${num.locality}, ` : ""}{num.region || selectedCountry?.name} &bull;{" "}
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          ${num.monthlyCost || "1.15"}/mo
                        </span>
                      </p>
                      <div className="flex items-center gap-1.5 pt-0.5">
                        {num.capabilities.voice && (
                          <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                            Voice
                          </Badge>
                        )}
                        {num.capabilities.sms && (
                          <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0 border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10">
                            SMS
                          </Badge>
                        )}
                        {num.capabilities.mms && (
                          <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0 border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10">
                            MMS
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => handleProvision(num.number)}
                      disabled={provisioning === num.number}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm h-9 px-4 gap-1.5"
                    >
                      {provisioning === num.number ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Claiming...</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Get Line</span>
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
