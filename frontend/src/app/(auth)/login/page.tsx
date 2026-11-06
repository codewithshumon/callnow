"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Phone, Lock, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import LoginForm from "./_components/LoginForm";
import PhoneOtpForm from "./_components/PhoneOtpForm";
import GoogleLoginButton from "./_components/GoogleLoginButton";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [mode, setMode] = useState<"email" | "phone">("email");

  return (
    <div className="space-y-6">
      {/* Header text */}
      <div className="space-y-2 text-center sm:text-left">
        <Badge variant="secondary" className="text-xs font-mono">
          Secure Portal
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Enter your credentials to access your phone lines and power dialer.
        </p>
      </div>

      {/* Main Form Card */}
      <Card className="rounded-3xl border border-border/80 bg-card shadow-xl overflow-hidden backdrop-blur">
        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Method Tabs: Email vs Phone */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-muted/60 border border-border/70 text-xs font-semibold gap-1">
            <button
              type="button"
              onClick={() => setMode("email")}
              className={cn(
                "py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all",
                mode === "email"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Mail className="h-4 w-4" />
              <span>Email &amp; Password</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("phone")}
              className={cn(
                "py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all",
                mode === "phone"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Phone className="h-4 w-4" />
              <span>Phone SMS OTP</span>
            </button>
          </div>

          {/* Form component */}
          {mode === "email" ? <LoginForm /> : <PhoneOtpForm />}

          {/* Social or divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
              <span className="bg-card px-3 text-muted-foreground font-medium">or continue with</span>
            </div>
          </div>

          <GoogleLoginButton />
        </CardContent>
      </Card>

      {/* Footer navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground px-2">
        <Link
          href="/forgot-password"
          className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
        >
          Forgot your password?
        </Link>
        <div>
          <span>New to VoiceLink? </span>
          <Link
            href="/register"
            className="font-semibold text-primary hover:underline ml-1"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
