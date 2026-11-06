"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Phone, KeyRound, ArrowRight, RotateCw, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import { post, extractApiError } from "@/lib/api";

export default function PhoneOtpForm() {
  const router = useRouter();
  const loginWithPhone = useAuthStore((s) => s.loginWithPhone);
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function requestOtp() {
    if (!phone || phone.length < 10) {
      toast.error("Enter a valid phone number (e.g. +1 555-0100)");
      return;
    }
    setIsSubmitting(true);
    try {
      await post("/auth/login/phone", { phone, action: "request" });
      setStep("code");
      setCooldown(60);
      toast.success("One-time security code sent via SMS!");
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function verifyCode() {
    if (code.length !== 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setIsSubmitting(true);
    try {
      await loginWithPhone(phone, code);
      toast.success("Welcome back!");
      router.push("/calls/dialpad");
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {step === "phone" ? (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="phone-login" className="text-xs font-semibold">
              Phone Number
            </Label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="phone-login"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-10 h-11 rounded-xl bg-muted/40 border-border/80 focus-visible:ring-primary/40 text-sm font-mono"
              />
            </div>
            <p className="text-[11px] text-muted-foreground pl-1">
              We&apos;ll send a 6-digit verification code to this mobile number.
            </p>
          </div>

          <Button
            type="button"
            onClick={requestOtp}
            disabled={isSubmitting || !phone}
            className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md text-sm gap-2"
          >
            <span>{isSubmitting ? "Sending SMS..." : "Send Verification Code"}</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3.5 flex items-center justify-between text-xs">
            <div>
              <p className="text-muted-foreground">Code sent to:</p>
              <p className="font-mono font-bold text-foreground">{phone}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setCode("");
              }}
              className="text-xs text-primary font-medium hover:underline"
            >
              Change
            </button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sms-code" className="text-xs font-semibold">
              6-Digit Security Code
            </Label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="sms-code"
                type="text"
                maxLength={6}
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
                className="pl-10 h-12 rounded-xl bg-muted/40 border-border/80 focus-visible:ring-primary/40 text-center text-lg font-mono tracking-widest"
                autoFocus
              />
            </div>
          </div>

          <Button
            type="button"
            onClick={verifyCode}
            disabled={isSubmitting || code.length !== 6}
            className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md text-sm gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{isSubmitting ? "Verifying..." : "Verify & Sign In"}</span>
          </Button>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={requestOtp}
              disabled={cooldown > 0 || isSubmitting}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
            >
              <RotateCw className="h-3 w-3" />
              <span>
                {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend SMS code"}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
