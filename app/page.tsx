import Link from "next/link";
import { BRAND_NAME, HOME_COPY } from "@/src/lib/design/copy";

export default function Home() {
  return (
    <main className="pixel-dot-bg min-h-dvh text-[#171717]">
      <section className="mx-auto grid min-h-[calc(100dvh-4rem)] w-full max-w-6xl gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:py-14">
        <div className="space-y-7">
          <p className="sticker-label">{HOME_COPY.eyebrow}</p>
          <div className="space-y-4">
            <h1 className="max-w-2xl text-5xl font-black leading-tight tracking-normal text-[#4c1d95] sm:text-6xl">
              {HOME_COPY.headline}
            </h1>
            <p className="max-w-xl text-lg font-semibold leading-8 text-[#4b5563]">
              {HOME_COPY.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-md border-2 border-[#171717] bg-[#111827] px-6 text-sm font-black text-white transition-colors hover:bg-[#0f766e]"
            >
              {HOME_COPY.cta}
            </Link>
            <a
              href="#preview"
              className="inline-flex h-12 items-center justify-center rounded-md border-2 border-[#171717] bg-white px-6 text-sm font-black transition-colors hover:bg-[#ccfbf1]"
            >
              샘플 보기
            </a>
          </div>
        </div>

        <div id="preview" className="pixel-board bg-[#fffdf7] p-5">
          <div className="flex items-center justify-between gap-4 border-b-2 border-[#171717] pb-4">
            <div>
              <p className="text-xs font-black text-[#0f766e]">
                /b/{HOME_COPY.previewSlug}
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-normal text-[#4c1d95]">
                민지님이 갖고 싶은 것들
              </h2>
            </div>
            <div className="grid h-14 w-14 place-items-center border-2 border-[#171717] bg-[#f97316] text-xl font-black text-white shadow-[4px_4px_0_#111827]">
              GIFT
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            <PreviewWish
              label="제일 갖고 싶어요"
              title="무선 헤드폰"
              amount="45,000원"
              color="#ccfbf1"
              progress="72%"
            />
            <PreviewWish
              label="마음 모으는 중"
              title="생일 케이크"
              amount="28,000원"
              color="#ffe4e6"
              progress="38%"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-10 sm:px-8">
        <div className="grid gap-3 border-t-2 border-[#171717] pt-6 md:grid-cols-3">
          <SmallSignal title={BRAND_NAME} body="친구에게 보내는 생일 카드 같은 공유 페이지" />
          <SmallSignal title="선물 관리" body="받고 싶은 선물, 상품 링크, 진행 상태를 한곳에서 정리" />
          <SmallSignal title="메시지" body="친구는 로그인 없이 마음을 남기는 흐름으로 확장" />
        </div>
      </section>
    </main>
  );
}

function PreviewWish({
  label,
  title,
  amount,
  color,
  progress,
}: {
  label: string;
  title: string;
  amount: string;
  color: string;
  progress: string;
}) {
  return (
    <article className="grid grid-cols-[76px_1fr] overflow-hidden border-2 border-[#171717] bg-white">
      <div
        className="grid min-h-24 place-items-center border-r-2 border-[#171717] text-xs font-black"
        style={{ backgroundColor: color }}
      >
        WANT
      </div>
      <div className="p-4">
        <p className="text-xs font-black text-[#0f766e]">{label}</p>
        <div className="mt-1 flex items-start justify-between gap-3">
          <h3 className="text-lg font-black tracking-normal">{title}</h3>
          <p className="text-sm font-black">{amount}</p>
        </div>
        <div className="mt-3 h-3 border border-[#171717] bg-[#f3f4f6]">
          <div className="h-full bg-[#0f766e]" style={{ width: progress }} />
        </div>
      </div>
    </article>
  );
}

function SmallSignal({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-2 border-[#171717] bg-white p-4">
      <h2 className="text-sm font-black tracking-normal">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#4b5563]">{body}</p>
    </div>
  );
}
