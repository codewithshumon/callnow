"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import RegisterForm from "./_components/RegisterForm";
import GoogleLoginButton from "../login/_components/GoogleLoginButton";

export default function RegisterPage() {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Get started with VoiceLink for free</CardDescription>
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
        <RegisterForm />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
