import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import QueryProvider from "@/components/QueryProvider";
import Providers from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
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
