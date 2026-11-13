import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function RootNotFound() {
  return (
    <main className="pixel-dot-bg grid min-h-dvh place-items-center px-5 text-[#171717]">
      <section className="w-full max-w-md space-y-4 border-2 border-[#171717] bg-[#fffdf7] p-6 shadow-pixel-xs">
        <p className="sticker-label">404</p>
        <h1 className="font-pixel text-2xl leading-tight text-[#4c1d95]">
          페이지를 찾을 수 없어요
        </h1>
        <p className="text-sm font-semibold leading-6 text-[#4b5563]">
          주소가 잘못되었거나 더 이상 존재하지 않는 페이지예요.
        </p>
        <Button asChild variant="cta">
          <Link href="/">처음으로</Link>
        </Button>
      </section>
    </main>
  );
}
