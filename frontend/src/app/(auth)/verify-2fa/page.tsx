"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/authStore";
import { post, extractApiError } from "@/lib/api";
import type { AuthTokens, User } from "@/lib/types";

function TwoFactorForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const loginToken = searchParams.get("loginToken");
  const setAuth = useAuthStore((s) => s.setAuth);
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleVerify() {
    if (!loginToken || code.length !== 6) return;
    setIsSubmitting(true);
    try {
      const res = await post<{ user: User } & AuthTokens>("/auth/2fa/verify", {
        loginToken,
        code,
      });
      setAuth(res.data.user, {
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
        expiresIn: res.data.expiresIn,
      });
      toast.success("Welcome back!");
      router.push("/messages");
    } catch (err) {
      toast.error(extractApiError(err).message);
      setCode("");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!loginToken) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-sm text-destructive">
          Invalid session. Please log in again.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>Enter the code from your authenticator app.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="2fa-code">Authentication Code</Label>
          <Input
            id="2fa-code"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
              if (e.target.value.replace(/\D/g, "").length === 6) {
                setTimeout(() => handleVerify(), 100);
              }
            }}
            className="text-center text-2xl tracking-[0.5em]"
            autoFocus
          />
        </div>
        <Button
          className="w-full"
          onClick={handleVerify}
          disabled={isSubmitting || code.length !== 6}
        >
          {isSubmitting ? "Verifying..." : "Verify"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function Verify2faPage() {
  return (
    <Suspense>
      <TwoFactorForm />
    </Suspense>
  );
}
