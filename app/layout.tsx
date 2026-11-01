import type { Metadata } from "next";
import { SiteAnalytics } from "./analytics";
import { monaPixel } from "./fonts";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { resolveSiteUrl } from "@/src/lib/metadata/site-url";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  metadataBase: resolveSiteUrl(),
  title: "생일 선물 펀딩 · 위시리스트 | 뭐갖고싶어",
  description:
    "친구들과 함께하는 생일 선물 펀딩. 받고 싶은 선물과 목표 금액을 정해 링크로 공유하세요. 친구들은 로그인 없이 축하 메시지를 남기고, 안내된 계좌로 직접 송금할 수 있어요.",
  openGraph: {
    title: "생일 선물 펀딩 · 위시리스트 | 뭐갖고싶어",
    description:
      "친구들과 함께하는 생일 선물 펀딩. 받고 싶은 선물과 목표 금액을 정해 링크로 공유하세요. 친구들은 로그인 없이 축하 메시지를 남기고, 안내된 계좌로 직접 송금할 수 있어요.",
    siteName: "뭐갖고싶어",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "생일 선물 펀딩 · 위시리스트 | 뭐갖고싶어",
    description:
      "친구들과 함께하는 생일 선물 펀딩. 받고 싶은 선물과 목표 금액을 정해 링크로 공유하세요. 친구들은 로그인 없이 축하 메시지를 남기고, 안내된 계좌로 직접 송금할 수 있어요.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={cn("h-full", "antialiased", monaPixel.variable, "font-sans", geist.variable)}>
      <body className="flex min-h-full flex-col">{children}<Toaster /><SiteAnalytics /></body>
    </html>
  );
}
