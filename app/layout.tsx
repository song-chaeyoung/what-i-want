import type { Metadata } from "next";
import { monaPixel } from "./fonts";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

function resolveMetadataBase(): URL {
  const raw = process.env.AUTH_URL?.trim().replace(/^["']|["']$/g, "");
  if (raw) {
    const candidate = /^https?:\/\//.test(raw) ? raw : `https://${raw}`;
    try {
      return new URL(candidate);
    } catch {
      // AUTH_URL is malformed — fall back so the build never crashes.
    }
  }
  return new URL("http://localhost:3000");
}

export const metadata: Metadata = {
  metadataBase: resolveMetadataBase(),
  title: "뭐갖고싶어",
  description: "받고 싶은 선물을 링크 하나로 모아 공유하세요.",
  openGraph: {
    title: "뭐갖고싶어",
    description: "받고 싶은 선물을 링크 하나로 모아 공유하세요.",
    siteName: "뭐갖고싶어",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "뭐갖고싶어",
    description: "받고 싶은 선물을 링크 하나로 모아 공유하세요.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={cn("h-full", "antialiased", monaPixel.variable, "font-sans", geist.variable)}>
      <body className="flex min-h-full flex-col">{children}<Toaster /></body>
    </html>
  );
}
