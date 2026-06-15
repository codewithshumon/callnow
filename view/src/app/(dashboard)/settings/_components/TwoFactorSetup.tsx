"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { post } from "@/lib/api";

interface Props { onEnabled: () => void; }

export default function TwoFactorSetup({ onEnabled }: Props) {
  const [showSetup, setShowSetup] = useState(false);
  const [secret, setSecret] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [code, setCode] = useState("");
  const [enabled, setEnabled] = useState(false);

  async function handleEnable() {
    try {
      const res = await post<{ secret: string; qrCodeUrl: string }>("/auth/2fa/enable");
      setSecret((res.data as any).secret);
      setQrUrl((res.data as any).qrCodeUrl);
      setShowSetup(true);
    } catch { toast.error("Failed to setup 2FA"); }
  }

  async function handleVerify() {
    try {
      await post("/auth/2fa/verify", { code });
      setEnabled(true); setShowSetup(false);
      toast.success("Two-factor authentication enabled!");
      onEnabled();
    } catch { toast.error("Invalid code"); }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div><p className="font-medium">Two-Factor Authentication</p><p className="text-sm text-muted-foreground">{enabled ? "Enabled" : "Disabled"}</p></div>
        {enabled ? <Switch checked disabled /> : <Button variant="outline" size="sm" onClick={handleEnable}>Enable 2FA</Button>}
      </div>
      {showSetup && (
        <div className="rounded-lg border p-4 space-y-3">
          <p className="text-sm">Scan this QR code with your authenticator app:</p>
          {qrUrl && <img src={qrUrl} alt="TOTP QR" className="mx-auto h-40 w-40" />}
          <p className="text-xs text-muted-foreground break-all">Or enter manually: {secret}</p>
          <div className="flex gap-2">
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code" maxLength={6} />
            <Button onClick={handleVerify} disabled={code.length !== 6}>Verify</Button>
          </div>
        </div>
      )}
    </div>
  );
}
