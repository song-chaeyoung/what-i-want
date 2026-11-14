import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function RootNotFound() {
  return (
    <main className="pixel-dot-bg grid min-h-dvh place-items-center px-5 text-ink">
      <Card
        asChild
        variant="pixel"
        surface="paper"
        shadow="xs"
        className="w-full max-w-md space-y-4 p-6"
      >
        <section>
          <p className="sticker-label">404</p>
          <h1 className="font-pixel text-2xl leading-tight text-purple">
            페이지를 찾을 수 없어요
          </h1>
          <p className="text-sm font-semibold leading-6 text-ink-soft">
            주소가 잘못되었거나 더 이상 존재하지 않는 페이지예요.
          </p>
          <Button asChild variant="cta">
            <Link href="/">처음으로</Link>
          </Button>
        </section>
      </Card>
    </main>
  );
}
