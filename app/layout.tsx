import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "뭐갖고싶어",
  description: "받고 싶은 선물을 링크 하나로 모아 공유하세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
