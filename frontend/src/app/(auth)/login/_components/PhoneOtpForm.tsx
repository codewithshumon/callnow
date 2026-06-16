"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
      toast.error("Enter a valid phone number");
      return;
    }
    setIsSubmitting(true);
    try {
      await post("/auth/login/phone", { phone, action: "request" });
      setStep("code");
      setCooldown(60);
      toast.success("Code sent!");
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
      router.push("/messages");
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (step === "code") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code sent to {phone}
        </p>
        <div className="space-y-2">
          <Label htmlFor="otp-code">Verification Code</Label>
          <Input
            id="otp-code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            onKeyDown={(e) => {
              if (e.key === "Enter") verifyCode();
            }}
            className="text-center text-2xl tracking-[0.5em]"
          />
        </div>
        <Button
          type="button"
          className="w-full"
          onClick={verifyCode}
          disabled={isSubmitting || code.length !== 6}
        >
          {isSubmitting ? "Verifying..." : "Verify & Log in"}
        </Button>
        <div className="text-center">
          <Button
            variant="link"
            size="xs"
            onClick={() => setStep("phone")}
            type="button"
          >
            Change phone number
          </Button>
          <span className="mx-1 text-muted-foreground">·</span>
          <Button
            variant="link"
            size="xs"
            disabled={cooldown > 0}
            onClick={requestOtp}
            type="button"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="phone-otp">Phone Number</Label>
        <Input
          id="phone-otp"
          type="tel"
          placeholder="+14155551234"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") requestOtp();
          }}
        />
      </div>
      <Button
        type="button"
        className="w-full"
        onClick={requestOtp}
        disabled={isSubmitting}
      >
        Send Verification Code
      </Button>
    </div>
  );
}
