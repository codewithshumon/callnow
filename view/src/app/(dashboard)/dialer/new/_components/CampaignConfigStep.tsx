"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { get } from "@/lib/api";
import type { PhoneNumber } from "@/lib/types";

interface CampaignConfig {
  fromNumber: string; concurrency: number; delaySeconds: number; retryMax: number;
  callingHoursStart: string; callingHoursEnd: string; callingHoursTimezone: string; scheduledAt: string;
}

interface Props { config: CampaignConfig; onChange: (c: CampaignConfig) => void; }

export default function CampaignConfigStep({ config, onChange }: Props) {
  const [userNumbers, setUserNumbers] = useState<PhoneNumber[]>([]);
  const [startNow, setStartNow] = useState(!config.scheduledAt);

  useEffect(() => {
    get<PhoneNumber[]>("/numbers").then((r) => {
      const nums = ((r.data as any) || []) as PhoneNumber[];
      setUserNumbers(nums);
      const first = nums.find((n: PhoneNumber) => n.capabilities.voice);
      if (first && !config.fromNumber) onChange({ ...config, fromNumber: first.number });
    }).catch(() => {});
  }, []);

  const voiceNums = userNumbers.filter((n) => n.capabilities.voice && n.status === "active");

  function set<K extends keyof CampaignConfig>(key: K, value: CampaignConfig[K]) { onChange({ ...config, [key]: value }); }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Calling Number</Label>
        <Select value={config.fromNumber} onValueChange={(v) => set("fromNumber", v ?? "")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{voiceNums.map((n) => <SelectItem key={n.id} value={n.number}>{n.number}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-2"><Label>Concurrency ({config.concurrency})</Label><Slider value={[config.concurrency]} onValueChange={(v) => set("concurrency", Array.isArray(v) ? v[0] : v)} min={1} max={10} step={1} /></div>
      <div className="space-y-2"><Label>Delay ({config.delaySeconds}s)</Label><Slider value={[config.delaySeconds]} onValueChange={(v) => set("delaySeconds", Array.isArray(v) ? v[0] : v)} min={0} max={60} step={1} /></div>
      <div className="space-y-2"><Label>Retry ({config.retryMax})</Label><Slider value={[config.retryMax]} onValueChange={(v) => set("retryMax", Array.isArray(v) ? v[0] : v)} min={0} max={3} step={1} /></div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2"><Label>Start</Label><Input type="time" value={config.callingHoursStart} onChange={(e) => set("callingHoursStart", e.target.value)} /></div>
        <div className="space-y-2"><Label>End</Label><Input type="time" value={config.callingHoursEnd} onChange={(e) => set("callingHoursEnd", e.target.value)} /></div>
        <div className="space-y-2"><Label>Timezone</Label><Input value={config.callingHoursTimezone} onChange={(e) => set("callingHoursTimezone", e.target.value)} placeholder="America/New_York" /></div>
      </div>
      <div className="flex items-center gap-3">
        <Label>Start now</Label>
        <Switch checked={startNow} onCheckedChange={(v) => { setStartNow(v); set("scheduledAt", v ? "" : new Date(Date.now() + 3600000).toISOString()); }} />
        {!startNow && <Input type="datetime-local" value={config.scheduledAt.slice(0, 16)} onChange={(e) => set("scheduledAt", new Date(e.target.value).toISOString())} />}
      </div>
    </div>
  );
}
