"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import LoginForm from "./_components/LoginForm";
import PhoneOtpForm from "./_components/PhoneOtpForm";
import GoogleLoginButton from "./_components/GoogleLoginButton";

export default function LoginPage() {
  const [mode, setMode] = useState<"email" | "phone">("email");

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Log in to your VoiceLink account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <GoogleLoginButton />
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>

        {mode === "email" ? (
          <>
            <LoginForm />
            <div className="text-center text-sm">
              <Button
                variant="link"
                size="xs"
                onClick={() => setMode("phone")}
                type="button"
              >
                Log in with phone number
              </Button>
            </div>
          </>
        ) : (
          <>
            <PhoneOtpForm />
            <div className="text-center text-sm">
              <Button
                variant="link"
                size="xs"
                onClick={() => setMode("email")}
                type="button"
              >
                Log in with email
              </Button>
            </div>
          </>
        )}

        <div className="flex justify-between text-sm">
          <Link
            href="/forgot-password"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Forgot password?
          </Link>
          <Link
            href="/register"
            className="text-primary hover:underline"
          >
            Create account
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
