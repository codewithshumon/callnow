"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Shield,
  Key,
  Trash2,
  Copy,
  Check,
  Sun,
  Moon,
  Laptop,
  Palette,
  User,
  Lock,
  QrCode,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/store/authStore";
import { post, get, put, del, extractApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { ApiKey } from "@/lib/types";

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    setMounted(true);
  }, []);

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
  const [showNewKey, setShowNewKey] = useState<string | null>(null);
  const [creatingKey, setCreatingKey] = useState(false);

  // Danger zone
  const [deleteConfirm, setDeleteConfirm] = useState("");

  async function handleSaveProfile() {
    setSavingProfile(true);
    try {
      await put("/users/profile", { firstName, lastName, phone });
      if (user) setUser({ ...user, firstName, lastName, phone });
      toast.success("Profile saved successfully");
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword() {
    if (newPw !== confirmPw) {
      toast.error("New passwords do not match");
      return;
    }
    setSavingPw(true);
    try {
      await post("/auth/change-password", {
        currentPassword: currentPw,
        newPassword: newPw,
      });
      toast.success("Password changed. Please log in again.");
      setTimeout(() => {
        logout();
        router.push("/login");
      }, 1500);
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setSavingPw(false);
    }
  }

  async function handleEnable2fa() {
    try {
      const res = await post<{ secret: string; qrCodeUrl: string }>("/auth/2fa/enable");
      setTotpSecret((res.data as any).secret);
      setTotpQrUrl((res.data as any).qrCodeUrl);
      setShow2faSetup(true);
    } catch (err) {
      toast.error(extractApiError(err).message);
    }
  }

  async function handleVerify2fa() {
    try {
      await post("/auth/2fa/verify", { code: totpCode });
      toast.success("Two-factor authentication enabled");
      setTwoFactorEnabled(true);
      setShow2faSetup(false);
    } catch (err) {
      toast.error(extractApiError(err).message);
    }
  }

  async function handleCreateKey() {
    setCreatingKey(true);
    try {
      const res = await post<{ key: string; apiKey: ApiKey }>("/api-keys", {
        name: `Key-${Date.now().toString().slice(-4)}`,
      });
      setShowNewKey((res.data as any).key);
      setApiKeys((p) => [...p, (res.data as any).apiKey]);
      toast.success("API key created");
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setCreatingKey(false);
    }
  }

  async function handleRevokeKey(id: string) {
    if (!confirm("Revoke this API key? This will invalidate integrations using it.")) return;
    try {
      await del(`/api-keys/${id}`);
      setApiKeys((p) => p.filter((k) => k.id !== id));
      toast.success("API key revoked");
    } catch {
      toast.error("Failed to revoke API key");
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full min-w-0 space-y-6">
      {/* Header bar */}
      <div className="pb-2 border-b border-border/60">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Account Settings & Security
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Configure profile details, interface theme, 2FA credentials, API keys, and access controls.
        </p>
      </div>

      {/* 2-Column Responsive Layout for Wide Screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Profile & Appearance */}
        <div className="space-y-6">
          {/* Profile Card */}
          <Card className="border border-border/80 shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-primary" /> Profile Information
              </CardTitle>
              <CardDescription className="text-xs">
                Your personal details used for outbound Caller ID name and notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">First Name</Label>
                  <Input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Last Name</Label>
                  <Input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Email Address</Label>
                <Input
                  value={user?.email || ""}
                  disabled
                  className="opacity-70 text-xs font-mono bg-muted/30"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Personal Callback Phone</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+14155551234"
                  className="text-xs font-mono"
                />
              </div>

              <Button
                size="sm"
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="text-xs bg-primary text-primary-foreground"
              >
                {savingProfile ? "Saving..." : "Save Profile"}
              </Button>
            </CardContent>
          </Card>

          {/* Theme & Appearance Card */}
          <Card className="border border-border/80 shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Palette className="h-4 w-4 text-primary" /> Appearance & Theme
              </CardTitle>
              <CardDescription className="text-xs">
                Customize the UI appearance between light, dark, or system modes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {mounted && (
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={cn(
                      "flex flex-col items-center justify-between rounded-xl border-2 p-3.5 text-center transition-all hover:bg-muted/50 cursor-pointer",
                      theme === "light"
                        ? "border-primary bg-primary/5 font-semibold"
                        : "border-border/80"
                    )}
                  >
                    <Sun className="h-5 w-5 text-amber-500 mb-2" />
                    <span className="text-xs">Light</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={cn(
                      "flex flex-col items-center justify-between rounded-xl border-2 p-3.5 text-center transition-all hover:bg-muted/50 cursor-pointer",
                      theme === "dark"
                        ? "border-primary bg-primary/5 font-semibold"
                        : "border-border/80"
                    )}
                  >
                    <Moon className="h-5 w-5 text-indigo-400 mb-2" />
                    <span className="text-xs">Dark</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme("system")}
                    className={cn(
                      "flex flex-col items-center justify-between rounded-xl border-2 p-3.5 text-center transition-all hover:bg-muted/50 cursor-pointer",
                      theme === "system"
                        ? "border-primary bg-primary/5 font-semibold"
                        : "border-border/80"
                    )}
                  >
                    <Laptop className="h-5 w-5 text-primary mb-2" />
                    <span className="text-xs">System</span>
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* API Keys Card */}
          <Card className="border border-border/80 shadow-2xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Key className="h-4 w-4 text-primary" /> API & Webhooks
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Generate secret tokens to integrate VoiceLink with CRM, Zapier, or custom code.
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCreateKey}
                  disabled={creatingKey}
                  className="text-xs h-8"
                >
                  Create Key
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {showNewKey && (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 space-y-1">
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    New Secret API Key Generated:
                  </p>
                  <div className="flex items-center justify-between bg-background p-2 rounded-lg border font-mono text-xs">
                    <span className="truncate pr-2">{showNewKey}</span>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(showNewKey);
                        toast.success("API key copied to clipboard");
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Copy this secret now. It will not be shown again.
                  </p>
                </div>
              )}

              {apiKeys.length === 0 && !showNewKey ? (
                <p className="text-xs text-muted-foreground py-4 text-center italic">
                  No active API keys yet. Click Create Key to generate one.
                </p>
              ) : (
                <div className="space-y-2">
                  {apiKeys.map((k) => (
                    <div
                      key={k.id}
                      className="flex items-center justify-between text-xs border rounded-xl p-2.5 bg-muted/20"
                    >
                      <div>
                        <p className="font-semibold">{k.name}</p>
                        <p className="font-mono text-muted-foreground text-[10px]">
                          Created: {new Date(k.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleRevokeKey(k.id)}
                        className="text-destructive hover:bg-destructive/10 text-xs"
                      >
                        Revoke
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Security, 2FA, Danger Zone */}
        <div className="space-y-6">
          {/* Change Password Card */}
          <Card className="border border-border/80 shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Lock className="h-4 w-4 text-primary" /> Password & Authentication
              </CardTitle>
              <CardDescription className="text-xs">
                Ensure your account is protected with a strong, distinct password.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Current Password</Label>
                <Input
                  type="password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">New Password</Label>
                <Input
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Confirm New Password</Label>
                <Input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  className="text-xs"
                />
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={handleChangePassword}
                disabled={savingPw || !currentPw || !newPw}
                className="text-xs"
              >
                {savingPw ? "Updating..." : "Update Password"}
              </Button>
            </CardContent>
          </Card>

          {/* Two-Factor Authentication (2FA) */}
          <Card className="border border-border/80 shadow-2xs">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4 text-emerald-500" /> Two-Factor Authentication (2FA)
              </CardTitle>
              <CardDescription className="text-xs">
                Add an extra layer of protection using Google Authenticator or 1Password.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold">TOTP Authenticator</p>
                  <p className="text-[11px] text-muted-foreground">
                    {twoFactorEnabled ? "2FA is active on your account" : "2FA is currently disabled"}
                  </p>
                </div>
                {!twoFactorEnabled && (
                  <Button size="sm" variant="outline" onClick={handleEnable2fa} className="text-xs">
                    Enable 2FA
                  </Button>
                )}
              </div>

              {show2faSetup && (
                <div className="rounded-xl border border-primary/20 bg-muted/20 p-4 space-y-3 pt-3">
                  <p className="text-xs font-semibold">Scan QR Code with Authenticator app:</p>
                  {totpQrUrl && (
                    <div className="flex justify-center p-2 bg-white rounded-xl w-36 mx-auto">
                      <img src={totpQrUrl} alt="2FA QR Code" className="w-32 h-32" />
                    </div>
                  )}
                  <p className="text-[10px] font-mono text-center text-muted-foreground">
                    Secret: {totpSecret}
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value)}
                      placeholder="6-digit code"
                      className="text-xs text-center font-mono tracking-widest"
                      maxLength={6}
                    />
                    <Button size="sm" onClick={handleVerify2fa} className="text-xs">
                      Verify & Activate
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border border-destructive/40 bg-destructive/5 shadow-2xs">
            <CardHeader className="pb-2">
              <CardTitle className="text-destructive flex items-center gap-2 text-base">
                <AlertTriangle className="h-4 w-4" /> Danger Zone
              </CardTitle>
              <CardDescription className="text-xs text-destructive/80">
                Permanent actions affecting your tenant data, numbers, and CDR records.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Deleting your account will release all virtual phone numbers and delete your messages and recordings.
              </p>
              <div className="flex items-center gap-2">
                <Input
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder='Type "DELETE" to confirm'
                  className="text-xs max-w-xs border-destructive/40"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deleteConfirm !== "DELETE"}
                  onClick={() => {
                    toast.error("Account deletion requested. Please contact support.");
                  }}
                  className="text-xs"
                >
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
