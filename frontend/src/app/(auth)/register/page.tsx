"use client";

import Link from "next/link";
import { Sparkles, CheckCircle2, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import RegisterForm from "./_components/RegisterForm";
import GoogleLoginButton from "../login/_components/GoogleLoginButton";

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2 text-center sm:text-left">
        <Badge variant="secondary" className="text-xs font-mono">
          Free 14-Day Trial
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Create your account
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Start placing calls and sending SMS globally in less than 2 minutes.
        </p>
      </div>

      {/* Trial Perks Box */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          Included in your free trial:
        </p>
        <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-foreground/80">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span>1 Virtual Phone Number</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span>100 Voice Minutes</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span>Browser WebRTC Dialpad</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span>No Credit Card Needed</span>
          </div>
        </div>
      </div>

      {/* Card */}
      <Card className="rounded-3xl border border-border/80 bg-card shadow-xl overflow-hidden backdrop-blur">
        <CardContent className="p-6 sm:p-8 space-y-5">
          <RegisterForm />

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
              <span className="bg-card px-3 text-muted-foreground font-medium">or register with</span>
            </div>
          </div>

          <GoogleLoginButton />
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground">
        <span>Already have an account? </span>
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
