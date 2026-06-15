"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { get, post, extractApiError } from "@/lib/api";
import type { AvailableNumber } from "@/lib/types";

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "IE", name: "Ireland" },
  { code: "NZ", name: "New Zealand" },
  { code: "ZA", name: "South Africa" },
];

interface Props { open: boolean; onClose: () => void; onAdded: () => void; }

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
      toast.success(`Number ${number} provisioned!`);
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

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetAndClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add Phone Number</DialogTitle></DialogHeader>

        {step === "search" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Country</Label>
              <Select value={countryCode} onValueChange={(v) => setCountryCode(v ?? "US")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Area Code (optional)</Label>
              <Input value={areaCode} onChange={(e) => setAreaCode(e.target.value)} placeholder="e.g. 415" maxLength={6} />
            </div>
            <div className="space-y-2">
              <Label>Capabilities</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={capVoice} onCheckedChange={(v) => setCapVoice(!!v)} /> Voice</label>
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={capSms} onCheckedChange={(v) => setCapSms(!!v)} /> SMS</label>
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={capMms} onCheckedChange={(v) => setCapMms(!!v)} /> MMS</label>
              </div>
            </div>
            <Button className="w-full" onClick={handleSearch} disabled={searching}>
              {searching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Search Numbers
            </Button>
          </div>
        )}

        {step === "results" && (
          <div className="space-y-3 max-h-[400px] overflow-auto">
            <Button variant="ghost" size="sm" onClick={() => setStep("search")} className="-ml-2">← Back to search</Button>
            {results.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No numbers available for this criteria. Try a different area code.</p>}
            {results.map((num) => (
              <div key={num.number} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{num.number}</p>
                  <p className="text-xs text-muted-foreground">{num.locality}, {num.region} · ${num.monthlyCost}/mo</p>
                  <div className="flex gap-1 mt-1">
                    {num.capabilities.voice && <Badge variant="outline" className="text-[10px]">Voice</Badge>}
                    {num.capabilities.sms && <Badge variant="outline" className="text-[10px]">SMS</Badge>}
                    {num.capabilities.mms && <Badge variant="outline" className="text-[10px]">MMS</Badge>}
                  </div>
                </div>
                <Button size="sm" onClick={() => handleProvision(num.number)} disabled={provisioning === num.number}>
                  {provisioning === num.number ? <Loader2 className="h-4 w-4 animate-spin" /> : "Get"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
