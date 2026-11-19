"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2, XCircle, Mail, ArrowRight, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { post, extractApiError } from "@/lib/api";

type State = "verifying" | "success" | "error" | "resent";

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const calledRef = useRef(false);

  const [state, setState] = useState<State>(token ? "verifying" : "error");
  const [errorMsg, setErrorMsg] = useState(
    token ? "" : "No verification token provided in URL."
  );
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!token || calledRef.current) return;
    calledRef.current = true;

    let cancelled = false;

    async function doVerify() {
      try {
        await post("/auth/verify-email", { token: token! });
        if (cancelled) return;
        setState("success");
      } catch (err) {
        if (cancelled) return;
        setState("error");
        setErrorMsg(extractApiError(err).message);
      }
    }

    doVerify();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (state !== "success") return;
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          router.push("/login");
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [state, router]);

  async function handleResend() {
    try {
      await post("/auth/verify-email", { token, resend: true });
      setState("resent");
    } catch (err) {
      setErrorMsg(extractApiError(err).message);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center sm:text-left">
        <Badge variant="secondary" className="text-xs font-mono">
          Account Activation
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          Email Verification
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Confirming your email address to enable phone number provisioning.
        </p>
      </div>

      <Card className="rounded-3xl border border-border/80 bg-card shadow-xl overflow-hidden backdrop-blur">
        <CardContent className="p-6 sm:p-8 space-y-6 text-center">
          {state === "verifying" && (
            <div className="space-y-4 py-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary ring-8 ring-primary/5 animate-pulse">
                <Loader2 className="h-7 w-7 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">Verifying token...</h3>
                <p className="text-xs text-muted-foreground">
                  Contacting security authority to activate your cloud phone lines.
                </p>
              </div>
            </div>
          )}

          {state === "success" && (
            <div className="space-y-4 py-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500 ring-8 ring-emerald-500/10">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">Email verified successfully!</h3>
                <p className="text-xs text-muted-foreground">
                  Your account is fully activated. Redirecting to sign in in {countdown}s...
                </p>
              </div>

              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90 mt-2"
              >
                <span>Sign In Now</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          {state === "error" && (
            <div className="space-y-4 py-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/15 text-destructive ring-8 ring-destructive/10">
                <XCircle className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">Verification failed</h3>
                <p className="text-xs text-destructive font-medium">
                  {errorMsg || "The verification link is invalid or has expired."}
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                {token && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResend}
                    className="w-full h-11 rounded-xl text-xs gap-1.5"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    <span>Request New Verification Email</span>
                  </Button>
                )}
                <Link
                  href="/login"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-muted px-5 py-3 text-xs font-semibold text-foreground hover:bg-muted/80 transition"
                >
                  <span>Return to Sign In</span>
                </Link>
              </div>
            </div>
          )}

          {state === "resent" && (
            <div className="space-y-4 py-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/15 text-blue-500 ring-8 ring-blue-500/10">
                <Mail className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">New link sent</h3>
                <p className="text-xs text-muted-foreground">
                  A fresh verification link has been sent to your registered email address.
                </p>
              </div>

              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-md transition hover:bg-primary/90"
              >
                <span>Back to Sign In</span>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  );
}
