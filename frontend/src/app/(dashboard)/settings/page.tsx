"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Shield, Key, Trash2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/authStore";
import { post, get, put, del, extractApiError } from "@/lib/api";
import type { ApiKey } from "@/lib/types";

export default function SettingsPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  // Profile state
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [show2faSetup, setShow2faSetup] = useState(false);
  const [totpSecret, setTotpSecret] = useState("");
  const [totpQrUrl, setTotpQrUrl] = useState("");
  const [totpCode, setTotpCode] = useState("");

  // API keys
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showNewKey, setShowNewKey] = useState<string | null>(null); // plaintext key shown once
  const [creatingKey, setCreatingKey] = useState(false);

  // Danger zone
  const [deleteConfirm, setDeleteConfirm] = useState("");

  async function handleSaveProfile() {
    setSavingProfile(true);
    try {
      await put("/users/profile", { firstName, lastName, phone });
      if (user) setUser({ ...user, firstName, lastName, phone });
      toast.success("Profile updated");
    } catch (err) { toast.error(extractApiError(err).message); }
    finally { setSavingProfile(false); }
  }

  async function handleChangePassword() {
    if (newPw !== confirmPw) { toast.error("Passwords don't match"); return; }
    setSavingPw(true);
    try {
      await post("/auth/change-password", { currentPassword: currentPw, newPassword: newPw });
      toast.success("Password changed. Please log in again.");
      setTimeout(() => { logout(); router.push("/login"); }, 1500);
    } catch (err) { toast.error(extractApiError(err).message); }
    finally { setSavingPw(false); }
  }

  async function handleEnable2fa() {
    try {
      const res = await post<{ secret: string; qrCodeUrl: string }>("/auth/2fa/enable");
      setTotpSecret((res.data as any).secret);
      setTotpQrUrl((res.data as any).qrCodeUrl);
      setShow2faSetup(true);
    } catch (err) { toast.error(extractApiError(err).message); }
  }

  async function handleVerify2fa() {
    try {
      await post("/auth/2fa/verify", { code: totpCode });
      setTwoFactorEnabled(true); setShow2faSetup(false);
      toast.success("2FA enabled!");
    } catch (err) { toast.error(extractApiError(err).message); }
  }

  async function handleCreateApiKey() {
    setCreatingKey(true);
    try {
      const res = await post<{ plaintext: string; key: ApiKey }>("/api-keys", { name: "Default", scopes: ["sms:send", "calls:read"] });
      setShowNewKey((res.data as any)?.plaintext || "");
      const r = await get<ApiKey[]>("/api-keys");
      setApiKeys((r.data as any) || []);
    } catch (err) { toast.error(extractApiError(err).message); }
    finally { setCreatingKey(false); }
  }

  async function handleRevokeKey(id: string) {
    try { await del(`/api-keys/${id}`); setApiKeys((p) => p.filter((k) => k.id !== id)); toast.success("Key revoked"); }
    catch { toast.error("Failed to revoke"); }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== user?.email) { toast.error("Type your email to confirm"); return; }
    try {
      await del("/users/me");
      toast.success("Account deleted. Goodbye.");
      logout(); router.push("/");
    } catch (err) { toast.error(extractApiError(err).message); }
  }

  return (
    <div className="p-6 max-w-2xl space-y-8">
      <h1 className="text-2xl font-semibold">Settings</h1>

      {/* Profile */}
      <Card>
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>First Name</Label><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
            <div className="space-y-1"><Label>Last Name</Label><Input value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
          </div>
          <div className="space-y-1"><Label>Email</Label><Input value={user?.email || ""} disabled className="opacity-60" /></div>
          <div className="space-y-1"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+14155551234" /></div>
          <Button onClick={handleSaveProfile} disabled={savingProfile}>{savingProfile ? "Saving..." : "Save Profile"}</Button>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1"><Label>Current Password</Label><Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} /></div>
          <div className="space-y-1"><Label>New Password</Label><Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} /></div>
          <div className="space-y-1"><Label>Confirm Password</Label><Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} /></div>
          <Button onClick={handleChangePassword} disabled={savingPw}>{savingPw ? "Changing..." : "Change Password"}</Button>
        </CardContent>
      </Card>

      {/* Security / 2FA */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Security</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div><p className="font-medium">Two-Factor Authentication</p><p className="text-sm text-muted-foreground">{twoFactorEnabled ? "Enabled" : "Disabled"}</p></div>
            {twoFactorEnabled ? (
              <Badge>Enabled</Badge>
            ) : (
              <Button variant="outline" size="sm" onClick={handleEnable2fa}>Enable 2FA</Button>
            )}
          </div>
          {show2faSetup && (
            <div className="rounded-lg border p-4 space-y-3">
              <p className="text-sm">Scan this QR code with your authenticator app:</p>
              {totpQrUrl && <img src={totpQrUrl} alt="TOTP QR" className="mx-auto h-40 w-40" />}
              <p className="text-xs text-muted-foreground">Or enter manually: {totpSecret}</p>
              <div className="flex gap-2">
                <Input value={totpCode} onChange={(e) => setTotpCode(e.target.value)} placeholder="6-digit code" maxLength={6} />
                <Button onClick={handleVerify2fa} disabled={totpCode.length !== 6}>Verify</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" /> API Keys</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {apiKeys.map((k) => (
            <div key={k.id} className="flex items-center justify-between rounded border px-3 py-2">
              <div><p className="text-sm font-mono">{k.keyPrefix}...</p><p className="text-xs text-muted-foreground">Created {new Date(k.createdAt).toLocaleDateString()}</p></div>
              <Button variant="ghost" size="sm" onClick={() => handleRevokeKey(k.id)} className="text-destructive">Revoke</Button>
            </div>
          ))}
          {showNewKey && (
            <div className="rounded-lg border border-yellow-500 bg-yellow-50 p-3 dark:bg-yellow-950/20">
              <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-1">Copy this key now — it won&apos;t be shown again!</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-background px-2 py-1 text-xs break-all">{showNewKey}</code>
                <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(showNewKey); toast.success("Copied!"); }}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={handleCreateApiKey} disabled={creatingKey}>
            {creatingKey ? "Creating..." : "Create API Key"}
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader><CardTitle className="text-destructive flex items-center gap-2"><Trash2 className="h-5 w-5" /> Danger Zone</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Permanently delete your account and all data. This action cannot be undone.</p>
          <div className="space-y-1">
            <Label>Type your email to confirm: {user?.email}</Label>
            <Input value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} placeholder={user?.email} />
          </div>
          <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteConfirm !== user?.email}>
            Delete My Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
