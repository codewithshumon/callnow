"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Mail, CheckCircle2, ArrowRight, ArrowLeft, KeyRound, RotateCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { post } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    try {
      await post("/auth/forgot-password", { email });
    } catch {
      // Don't leak user enumeration
    } finally {
      setIsSent(true);
      setCooldown(60);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header text */}
      <div className="space-y-2 text-center sm:text-left">
        <Badge variant="secondary" className="text-xs font-mono">
          Account Recovery
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Reset password
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Enter your registered email address and we&apos;ll send you a secure link to reset your credentials.
        </p>
      </div>

      <Card className="rounded-3xl border border-border/80 bg-card shadow-xl overflow-hidden backdrop-blur">
        <CardContent className="p-6 sm:p-8 space-y-6">
          {isSent ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500 ring-8 ring-emerald-500/10">
                <CheckCircle2 className="h-7 w-7" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-foreground">Reset link dispatched</h3>
                <p className="text-xs text-muted-foreground">
                  If an account exists for <strong className="text-foreground">{email}</strong>, we have sent instructions to reset your password.
                </p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-muted/40 p-4 text-left text-xs text-muted-foreground space-y-1.5">
                <p className="font-semibold text-foreground">Didn&apos;t receive it?</p>
                <ul className="list-disc list-inside space-y-1 text-[11px]">
                  <li>Check your junk or spam folder</li>
                  <li>Verify that your work email was typed correctly</li>
                  <li>Wait 1–2 minutes for mail server delivery</li>
                </ul>
              </div>

              <div className="space-y-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSubmit}
                  disabled={cooldown > 0 || isSubmitting}
                  className="w-full h-11 rounded-xl text-xs gap-1.5"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  <span>
                    {cooldown > 0 ? `Resend email in ${cooldown}s` : "Resend reset link"}
                  </span>
                </Button>

                <Link
                  href="/login"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="forgot-email" className="text-xs font-semibold">
                  Registered Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-11 rounded-xl bg-muted/40 border-border/80 focus-visible:ring-primary/40 text-sm"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md text-sm gap-2"
                disabled={isSubmitting || !email}
              >
                <span>{isSubmitting ? "Sending Link..." : "Send Reset Link"}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <div className="text-center text-xs text-muted-foreground">
        <Link
          href="/login"
          className="hover:text-foreground inline-flex items-center gap-1.5 transition-colors font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Remember your password? Back to Sign In</span>
        </Link>
      </div>
    </div>
  );
}
