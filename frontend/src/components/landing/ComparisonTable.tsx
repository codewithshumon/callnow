"use client";

import { Check, X, Sparkles, Building2, Laptop } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ROWS = [
  {
    feature: "Deployment Time",
    voiceLink: "60 Seconds (Browser signup)",
    traditional: "2–4 Weeks (Carrier approval)",
  },
  {
    feature: "Hardware & Equipment",
    voiceLink: "Zero ($0) — Any laptop or headset",
    traditional: "Expensive PBX racks & desk phones ($400/seat)",
  },
  {
    feature: "International Number Provisioning",
    voiceLink: "Instant 1-Click in 50+ countries",
    traditional: "Lengthy local enterprise contracts",
  },
  {
    feature: "Outbound Power Dialer",
    voiceLink: "Built-in with AMD & smart pacing",
    traditional: "Third-party add-ons ($120+/mo per seat)",
  },
  {
    feature: "Two-Way SMS & MMS",
    voiceLink: "Included with delivery receipts & templates",
    traditional: "Often unsupported or clunky separate app",
  },
  {
    feature: "Remote Team Ready",
    voiceLink: "Global WebRTC access from anywhere",
    traditional: "Tethered to office desks or complex VPNs",
  },
];

export default function ComparisonTable() {
  return (
    <div className="space-y-8 w-full mx-auto">
      <div className="text-center space-y-3">
        <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary text-xs font-semibold px-3 py-1">
          Why Modern Teams Switch
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          VoiceLink vs. Legacy Telecom Carriers
        </h2>
        <p className="text-muted-foreground text-base max-w-2xl mx-auto">
          See why modern sales forces and international companies replace legacy copper lines with VoiceLink.
        </p>
      </div>

      <div className="rounded-3xl border border-border/80 bg-card/80 shadow-xl overflow-hidden backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40">
                <th className="p-4 sm:p-5 text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider w-1/3">
                  Capability
                </th>
                <th className="p-4 sm:p-5 text-xs sm:text-sm font-bold text-primary uppercase tracking-wider bg-primary/5 border-x border-border/50 w-1/3">
                  <div className="flex items-center gap-2">
                    <Laptop className="h-4 w-4 text-primary" />
                    <span>VoiceLink Platform</span>
                  </div>
                </th>
                <th className="p-4 sm:p-5 text-xs sm:text-sm font-semibold text-muted-foreground uppercase tracking-wider w-1/3">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>Legacy Carriers & PBX</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-xs sm:text-sm">
              {ROWS.map((row, i) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 sm:p-5 font-medium text-foreground">
                    {row.feature}
                  </td>
                  <td className="p-4 sm:p-5 bg-primary/5 font-semibold text-foreground border-x border-border/50">
                    <div className="flex items-center gap-2">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <span>{row.voiceLink}</span>
                    </div>
                  </td>
                  <td className="p-4 sm:p-5 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                        <X className="h-3.5 w-3.5" />
                      </div>
                      <span>{row.traditional}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
