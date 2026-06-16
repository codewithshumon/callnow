import Link from "next/link";
import { Phone, MessageSquare, Hash, BarChart3, Globe } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const linkButtonClasses = cn(
  "inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent",
  "text-sm font-medium whitespace-nowrap transition-all outline-none select-none",
  "h-9 gap-1.5 px-2.5",
  "bg-primary text-primary-foreground hover:bg-primary/80"
);

const ghostLinkClasses = cn(
  "inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent",
  "text-sm font-medium whitespace-nowrap transition-all outline-none select-none",
  "h-9 gap-1.5 px-2.5",
  "hover:bg-muted hover:text-foreground"
);

const outlineLinkClasses = cn(
  "inline-flex shrink-0 items-center justify-center rounded-lg border",
  "text-sm font-medium whitespace-nowrap transition-all outline-none select-none",
  "h-9 gap-1.5 px-2.5",
  "border-border bg-background hover:bg-muted hover:text-foreground"
);

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <Phone className="h-5 w-5 text-primary" />
            VoiceLink
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/login" className={ghostLinkClasses}>
              Log in
            </Link>
            <Link href="/register" className={linkButtonClasses}>
              Get Started Free
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center">
        <Badge variant="secondary" className="mb-6 text-sm">
          Now in public beta
        </Badge>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
          International Calling & Messaging
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          One platform. Any browser. No SIM required. Make calls, send SMS,
          and run power dialer campaigns — all from your laptop.
        </p>
        <div className="mt-8 flex gap-4">
          <Link href="/register" className={linkButtonClasses}>
            Get Started Free
          </Link>
          <Link href="/login" className={outlineLinkClasses}>
            Sign In
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold tracking-tight">
            Everything you need to communicate globally
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-muted-foreground">
            VoiceLink replaces expensive carrier plans and bulky dialing
            hardware with a single browser-based platform.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <Phone className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>Browser Calls</CardTitle>
                <CardDescription>
                  Make and receive VoIP calls directly from your browser using
                  WebRTC. Crystal-clear audio — no phone line needed.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Hash className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>Virtual Numbers</CardTitle>
                <CardDescription>
                  Get a real phone number in the US, Canada, UK, and more.
                  Clients see a local number, not an international one.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <BarChart3 className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>Power Dialer</CardTitle>
                <CardDescription>
                  Upload a CSV of leads and let the system dial them
                  automatically. Track progress in real time.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <MessageSquare className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>SMS & MMS Messaging</CardTitle>
                <CardDescription>
                  Send text messages, photos, and files to any phone number
                  worldwide. Real-time delivery status included.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Globe className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>Provider Flexibility</CardTitle>
                <CardDescription>
                  Built on a provider-agnostic layer. Start with Twilio, switch
                  to Vonage, Bandwidth, or others — no code changes.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="border-t py-20">
        <div className="container mx-auto max-w-3xl px-4 text-center">
          <blockquote className="text-xl font-medium italic text-muted-foreground">
            &ldquo;VoiceLink lets me take client calls on my US number from
            London. My clients don&apos;t even know I&apos;m overseas. It just
            works.&rdquo;
          </blockquote>
          <p className="mt-4 font-semibold">Sarah Johnson</p>
          <p className="text-sm text-muted-foreground">Remote Worker, London</p>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t py-20">
        <div className="container mx-auto max-w-lg px-4 text-center">
          <h2 className="text-2xl font-bold tracking-tight">
            Ready to get started?
          </h2>
          <p className="mt-2 text-muted-foreground">
            Sign up in under a minute. Pick a number. Send your first message.
          </p>
          <Link href="/register" className={linkButtonClasses}>
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} VoiceLink. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
