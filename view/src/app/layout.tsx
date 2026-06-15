import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import QueryProvider from "@/components/QueryProvider";
import Providers from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "VoiceLink — International Calling & Messaging",
    template: "%s | VoiceLink",
  },
  description:
    "VoiceLink enables international calling, SMS/MMS messaging, and automated power dialing — all from your browser. No SIM required.",
  keywords: [
    "VoIP",
    "international calling",
    "SMS",
    "virtual phone number",
    "power dialer",
    "WebRTC",
  ],
  authors: [{ name: "VoiceLink" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "VoiceLink",
    title: "VoiceLink — International Calling & Messaging Platform",
    description:
      "Make international calls, send SMS, and run power dialer campaigns from your browser.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">
          Skip to content
        </a>
        <Providers>
          <QueryProvider>
            <TooltipProvider>{children}</TooltipProvider>
            <Toaster richColors closeButton />
          </QueryProvider>
        </Providers>
      </body>
    </html>
  );
}
