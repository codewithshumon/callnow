"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, Inbox } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import { extractApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

const registerSchema = z
  .object({
    email: z.string().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[0-9]/, "Include at least one number")
      .regex(/[^a-zA-Z0-9]/, "Include at least one special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score += 25;
  if (/[0-9]/.test(pw)) score += 25;
  if (/[^a-zA-Z0-9]/.test(pw)) score += 25;
  if (/[A-Z]/.test(pw)) score += 25;

  if (score <= 25) return { score, label: "Weak", color: "bg-red-500" };
  if (score <= 50) return { score, label: "Fair", color: "bg-amber-500" };
  if (score <= 75) return { score, label: "Good", color: "bg-blue-500" };
  return { score, label: "Strong", color: "bg-emerald-500" };
}

export default function RegisterForm({ onSuccess }: { onSuccess?: () => void }) {
  const register = useAuthStore((s) => s.register);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register: registerField,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const password = watch("password") || "";
  const strength = passwordStrength(password);

  async function onSubmit(values: RegisterFormValues) {
    setIsSubmitting(true);
    setUserEmail(values.email);
    try {
      await register(values.email, values.password);
      setIsSuccess(true);
      onSuccess?.();
    } catch (err) {
      toast.error(extractApiError(err).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 ring-8 ring-emerald-500/10">
          <Inbox className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-foreground">Verify your email</h2>
          <p className="text-xs text-muted-foreground">
            We sent a verification activation link to:
          </p>
          <p className="font-mono font-bold text-sm text-foreground">{userEmail}</p>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Click the link in the message to activate your VoiceLink account, or proceed directly to login once verified.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90"
        >
          <span>Continue to Login</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Email Field */}
      <div className="space-y-1.5">
        <Label htmlFor="reg-email" className="text-xs font-semibold">
          Work Email
        </Label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="reg-email"
            type="email"
            placeholder="sarah@company.com"
            autoComplete="email"
            className="pl-10 h-11 rounded-xl bg-muted/40 border-border/80 focus-visible:ring-primary/40 text-sm"
            {...registerField("email")}
            aria-invalid={!!errors.email}
          />
        </div>
        {errors.email && (
          <p className="text-xs text-destructive font-medium pl-1">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-1.5">
        <Label htmlFor="reg-password" className="text-xs font-semibold">
          Create Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="reg-password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="new-password"
            className="pl-10 pr-10 h-11 rounded-xl bg-muted/40 border-border/80 focus-visible:ring-primary/40 text-sm font-mono"
            {...registerField("password")}
            aria-invalid={!!errors.password}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {/* Strength Meter */}
        {password && (
          <div className="space-y-1 pt-1">
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full transition-all duration-300", strength.color)}
                style={{ width: `${strength.score}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-muted-foreground">
              <span>Security: <strong className="text-foreground">{strength.label}</strong></span>
              <span>8+ chars, 1 number, 1 special</span>
            </div>
          </div>
        )}

        {errors.password && (
          <p className="text-xs text-destructive font-medium pl-1">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-1.5">
        <Label htmlFor="reg-confirm" className="text-xs font-semibold">
          Confirm Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="reg-confirm"
            type={showConfirm ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="new-password"
            className="pl-10 pr-10 h-11 rounded-xl bg-muted/40 border-border/80 focus-visible:ring-primary/40 text-sm font-mono"
            {...registerField("confirmPassword")}
            aria-invalid={!!errors.confirmPassword}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-destructive font-medium pl-1">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md text-sm gap-2 mt-2"
        disabled={isSubmitting}
      >
        <span>{isSubmitting ? "Provisioning Trial Account..." : "Create Free Account"}</span>
        <ArrowRight className="h-4 w-4" />
      </Button>
    </form>
  );
}
