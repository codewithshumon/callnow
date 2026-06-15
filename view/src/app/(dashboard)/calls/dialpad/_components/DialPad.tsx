"use client";

import { useState, useEffect } from "react";
import { Phone, Delete } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { get, getPaginated } from "@/lib/api";
import { initializeCallClient, makeCall } from "@/lib/webrtc";
import { toast } from "sonner";
import type { CallToken, PhoneNumber, Call } from "@/lib/types";

const DTMF_KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["*", "0", "#"],
];

export default function DialPad() {
  const [number, setNumber] = useState("");
  const [fromNumber, setFromNumber] = useState("");
  const [userNumbers, setUserNumbers] = useState<PhoneNumber[]>([]);
  const [recentCalls, setRecentCalls] = useState<Call[]>([]);
  const [calling, setCalling] = useState(false);

  useEffect(() => {
    get<PhoneNumber[]>("/numbers").then((r) => {
      setUserNumbers((r.data as any) || []);
      const firstVoice = ((r.data as any) || []).find((n: PhoneNumber) => n.capabilities.voice);
      if (firstVoice) setFromNumber(firstVoice.number);
    }).catch(() => {});
    getPaginated<Call>("/calls", { limit: 5 }).then((r) => setRecentCalls(r.data)).catch(() => {});
  }, []);

  const voiceNumbers = userNumbers.filter((n) => n.capabilities.voice && n.status === "active");

  function appendDigit(d: string) { setNumber((n) => n + d); }
  function backspace() { setNumber((n) => n.slice(0, -1)); }

  async function handleCall() {
    if (!number || number.length < 6) { toast.error("Enter a valid phone number"); return; }
    if (!fromNumber) { toast.error("Select a number to call from"); return; }
    setCalling(true);
    try {
      const res = await get<CallToken>("/calls/token");
      await initializeCallClient(res.data);
      await makeCall({ to: number, from: fromNumber });
    } catch {
      toast.error("Could not initiate call.");
    } finally {
      setCalling(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-xs flex-col items-center gap-4 p-6">
      <div className="w-full space-y-2">
        <label className="text-xs text-muted-foreground">From</label>
        <Select value={fromNumber} onValueChange={(v) => setFromNumber(v ?? "")}>
          <SelectTrigger className="w-full text-sm">
            <SelectValue placeholder="Select your number" />
          </SelectTrigger>
          <SelectContent>
            {voiceNumbers.map((n) => (
              <SelectItem key={n.id} value={n.number}>
                {n.number} {n.friendlyName ? `(${n.friendlyName})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-full rounded-lg border bg-muted/30 px-4 py-3 text-center">
        <span className="text-2xl font-mono tracking-wide">{number || "Enter number"}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 w-full">
        {DTMF_KEYS.flat().map((key) => (
          <button
            key={key}
            onClick={() => appendDigit(key)}
            className="flex h-14 items-center justify-center rounded-lg border bg-background text-xl font-medium hover:bg-muted transition-colors active:scale-95"
          >
            {key}
            {key === "0" && <span className="ml-1 text-xs">+</span>}
          </button>
        ))}
      </div>

      <div className="flex w-full gap-2">
        <Button variant="outline" size="icon" onClick={backspace} className="h-12 w-12 shrink-0">
          <Delete className="h-5 w-5" />
        </Button>
        <Button
          onClick={handleCall}
          disabled={calling || !number}
          className="flex-1 h-12 rounded-full bg-green-500 hover:bg-green-600 text-white"
        >
          <Phone className="mr-2 h-5 w-5" />
          {calling ? "Calling..." : "Call"}
        </Button>
      </div>

      {recentCalls.length > 0 && (
        <div className="w-full mt-4">
          <p className="text-xs text-muted-foreground mb-2">Recent</p>
          <div className="space-y-1">
            {recentCalls.slice(0, 5).map((c) => (
              <button
                key={c.id}
                onClick={() => setNumber(c.direction === "outbound" ? c.toNumber : c.fromNumber)}
                className="w-full text-left text-sm px-3 py-1.5 rounded hover:bg-muted transition-colors"
              >
                {c.direction === "outbound" ? c.toNumber : c.fromNumber}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
