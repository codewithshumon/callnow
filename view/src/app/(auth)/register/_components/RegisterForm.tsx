"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useAuthStore } from "@/store/authStore";
import { extractApiError } from "@/lib/api";

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

function passwordStrength(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score += 25;
  if (/[0-9]/.test(pw)) score += 25;
  if (/[^a-zA-Z0-9]/.test(pw)) score += 25;
  if (/[A-Z]/.test(pw)) score += 25;
  return score;
}

export default function RegisterForm({ onSuccess }: { onSuccess?: () => void }) {
  const register = useAuthStore((s) => s.register);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register: registerField,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const password = watch("password");
  const strength = passwordStrength(password || "");

  async function onSubmit(values: RegisterFormValues) {
    setIsSubmitting(true);
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
      <div className="rounded-lg border bg-card p-6 text-center space-y-3">
        <h2 className="text-xl font-semibold">Check your email</h2>
        <p className="text-sm text-muted-foreground">
          We&apos;ve sent a verification link to your email address.
          Click the link to activate your account, then log in.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reg-email">Email</Label>
        <Input
          id="reg-email"
          type="email"
          placeholder="sarah@example.com"
          autoComplete="email"
          {...registerField("email")}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-password">Password</Label>
        <Input
          id="reg-password"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          {...registerField("password")}
          aria-invalid={!!errors.password}
        />
        {password && (
          <div className="space-y-1">
            <Progress value={strength} className="h-1" />
            <p className="text-xs text-muted-foreground">
              {strength <= 25 && "Weak"}
              {strength > 25 && strength <= 50 && "Fair"}
              {strength > 50 && strength <= 75 && "Good"}
              {strength > 75 && "Strong"}{" "}
              — 8+ chars, 1 number, 1 special character
            </p>
          </div>
        )}
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-confirm">Confirm Password</Label>
        <Input
          id="reg-confirm"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          {...registerField("confirmPassword")}
          aria-invalid={!!errors.confirmPassword}
        />
        {errors.confirmPassword && (
          <p className="text-xs text-destructive">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating account..." : "Create Account"}
      </Button>
    </form>
  );
}
