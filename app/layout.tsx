import type { Metadata } from "next";
import { monaPixel } from "./fonts";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.AUTH_URL || "http://localhost:3000"),
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
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
