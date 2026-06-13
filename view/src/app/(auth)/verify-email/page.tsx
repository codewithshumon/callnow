"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { post, extractApiError } from "@/lib/api";

type State = "verifying" | "success" | "error" | "resent";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [state, setState] = useState<State>("verifying");
  const [errorMsg, setErrorMsg] = useState("");

  const verify = useCallback(async (t: string) => {
    setState("verifying");
    try {
      await post("/auth/verify-email", { token: t });
      setState("success");
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      setState("error");
      setErrorMsg(extractApiError(err).message);
    }
  }, [router]);

  useEffect(() => {
    if (token) verify(token);
    else { setState("error"); setErrorMsg("No verification token provided."); }
  }, [token, verify]);

  async function handleResend() {
    try {
      await post("/auth/verify-email", { token, resend: true });
      setState("resent");
    } catch (err) {
      setErrorMsg(extractApiError(err).message);
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Email Verification</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 text-center">
        {state === "verifying" && (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Verifying your email...</p>
          </>
        )}
        {state === "success" && (
          <>
            <CheckCircle className="h-10 w-10 text-green-500" />
            <p className="text-sm">Email verified! Redirecting to login...</p>
          </>
        )}
        {state === "error" && (
          <>
            <XCircle className="h-10 w-10 text-destructive" />
            <p className="text-sm text-destructive">{errorMsg || "Invalid or expired link."}</p>
            <Button variant="outline" size="sm" onClick={handleResend}>
              Resend verification email
            </Button>
          </>
        )}
        {state === "resent" && (
          <>
            <CheckCircle className="h-10 w-10 text-green-500" />
            <p className="text-sm">Verification email resent. Check your inbox.</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  );
}
