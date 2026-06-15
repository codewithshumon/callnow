"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore";
import { post } from "@/lib/api";
import TwoFactorSetup from "./TwoFactorSetup";

export default function SecuritySection() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleChangePassword() {
    if (newPw !== confirmPw) { toast.error("Passwords don't match"); return; }
    setSaving(true);
    try {
      await post("/auth/change-password", { currentPassword: currentPw, newPassword: newPw });
      toast.success("Password changed. Please log in again.");
      setTimeout(() => { logout(); router.push("/login"); }, 1500);
    } catch { toast.error("Failed to change password"); }
    finally { setSaving(false); }
  }

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Security</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <TwoFactorSetup onEnabled={() => toast.success("2FA enabled")} />
        <div className="border-t pt-4 space-y-3">
          <p className="font-medium">Change Password</p>
          <div className="space-y-1"><Label>Current Password</Label><Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} /></div>
          <div className="space-y-1"><Label>New Password</Label><Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} /></div>
          <div className="space-y-1"><Label>Confirm Password</Label><Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} /></div>
          <Button onClick={handleChangePassword} disabled={saving}>{saving ? "Changing..." : "Change Password"}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
