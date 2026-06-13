"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { post, extractApiError } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSent, setIsSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await post("/auth/forgot-password", { email });
    } catch {
      // Always show success — don't reveal if email exists
    } finally {
      setIsSent(true);
      setIsSubmitting(false);
    }
  }

  if (isSent) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
          <CheckCircle className="h-10 w-10 text-green-500" />
          <p className="text-sm">
            If an account exists for that email, we&apos;ve sent a reset link.
          </p>
          <Link href="/login" className="text-sm text-primary hover:underline">
            Back to login
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a reset link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="forgot-email">Email</Label>
            <Input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah@example.com"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send Reset Link"}
          </Button>
          <p className="text-center text-sm">
            <Link href="/login" className="text-muted-foreground hover:text-foreground">
              Back to login
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
