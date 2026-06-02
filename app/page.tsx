import Link from "next/link";
import { BRAND_NAME, HOME_COPY } from "@/src/lib/design/copy";

const previewWishes = [
  {
    label: "제일 갖고 싶어요",
    title: "무선 헤드폰",
    amount: "45,000원",
    color: "#ccfbf1",
    progress: "72%",
    imageTone: "mint",
  },
  {
    label: "마음 모으는 중",
    title: "생일 케이크",
    amount: "28,000원",
    color: "#ffe4e6",
    progress: "38%",
    imageTone: "rose",
  },
] as const;

const homeSteps = [
  { number: "01", title: "만들기", label: "선물 담기" },
  { number: "02", title: "공유하기", label: `/b/${HOME_COPY.previewSlug}` },
  { number: "03", title: "마음 받기", label: "메시지 도착" },
] as const;

const homeSignals = [
  {
    sticker: "PUBLIC",
    title: BRAND_NAME,
    label: "생일 카드 같은 공개 페이지",
    progress: "86%",
    color: "#ccfbf1",
  },
  {
    sticker: "WISH",
    title: "선물 관리",
    label: "링크와 상태를 한눈에",
    progress: "64%",
    color: "#fed7aa",
  },
  {
    sticker: "HEART",
    title: "메시지",
    label: "로그인 없이 마음 남기기",
    progress: "48%",
    color: "#ddd6fe",
  },
] as const;

export default function Home() {
  return (
    <main className="pixel-dot-bg min-h-dvh text-[#171717]">
      <section className="mx-auto grid min-h-[calc(100dvh-3rem)] w-full max-w-6xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:py-12">
        <div className="space-y-6">
          <p className="sticker-label max-w-full whitespace-normal break-keep">
            {HOME_COPY.eyebrow}
          </p>
          <div className="space-y-4">
            <h1 className="font-pixel max-w-2xl text-4xl leading-tight tracking-normal text-[#4c1d95] sm:text-6xl">
              {HOME_COPY.headline}
            </h1>
            <p className="max-w-lg text-base font-semibold leading-7 text-[#4b5563] sm:text-lg sm:leading-8">
              {HOME_COPY.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex min-h-12 max-w-full items-center justify-center rounded-md border-2 border-[#171717] bg-[#111827] px-5 py-3 text-center text-sm font-black text-white transition-colors hover:bg-[#0f766e] sm:px-6"
            >
              <span className="whitespace-normal break-keep">{HOME_COPY.cta}</span>
            </Link>
            <a
              href="#preview"
              className="inline-flex min-h-12 max-w-full items-center justify-center rounded-md border-2 border-[#171717] bg-white px-5 py-3 text-center text-sm font-black transition-colors hover:bg-[#ccfbf1] sm:px-6"
            >
              <span className="whitespace-normal break-keep">샘플 보기</span>
            </a>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {homeSteps.map((step) => (
              <div
                key={step.number}
                className="min-w-0 border-2 border-[#171717] bg-white/80 p-3 shadow-[3px_3px_0_#111827]"
              >
                <p className="font-pixel text-[10px] leading-none text-[#0f766e]">
                  {step.number}
                </p>
                <h2 className="font-pixel mt-2 truncate text-sm tracking-normal text-[#4c1d95]">
                  {step.title}
                </h2>
                <p className="mt-1 truncate text-xs font-black text-[#4b5563]">
                  {step.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div
          id="preview"
          className="border-2 border-[#171717] bg-[#fffdf7] p-4 shadow-[6px_6px_0_#111827] sm:p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-[#171717] pb-4">
            <div className="min-w-0">
              <p className="truncate text-xs font-black text-[#0f766e]">
                /b/{HOME_COPY.previewSlug}
              </p>
              <h2 className="font-pixel mt-1 text-2xl tracking-normal text-[#4c1d95] sm:text-3xl">
                민지님의 공개 위시리스트
              </h2>
            </div>
            <SignalSticker text="LIVE" color="#f97316" />
          </div>

          <div className="mt-5 grid gap-4">
            {previewWishes.map((wish) => (
              <PreviewWish key={wish.title} {...wish} />
            ))}
          </div>

          <div className="mt-5 grid gap-3 border-t-2 border-[#171717] pt-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="min-w-0">
              <p className="font-pixel text-sm tracking-normal text-[#4c1d95]">
                오늘 모인 마음
              </p>
              <GiftProgress progress="58%" color="#0f766e" />
            </div>
            <Link
              href="/login"
              className="inline-flex min-h-11 max-w-full items-center justify-center rounded-md border-2 border-[#171717] bg-[#f97316] px-5 py-2 text-center text-sm font-black text-white transition-colors hover:bg-[#4c1d95]"
            >
              <span className="whitespace-normal break-keep">내 위시리스트 만들기</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-10 sm:px-8">
        <div className="grid gap-3 border-t-2 border-[#171717] pt-6 md:grid-cols-3">
          {homeSignals.map((signal) => (
            <SmallSignal key={signal.sticker} {...signal} />
          ))}
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
  imageTone,
}: {
  label: string;
  title: string;
  amount: string;
  color: string;
  progress: string;
  imageTone: "mint" | "rose";
}) {
  return (
    <article className="grid grid-cols-[88px_1fr] overflow-hidden border-2 border-[#171717] bg-white sm:grid-cols-[112px_1fr]">
      <SampleGiftImage tone={imageTone} label={label} />
      <div className="min-w-0 p-4">
        <p className="font-pixel truncate text-xs text-[#0f766e]">{label}</p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-2">
          <h3 className="font-pixel min-w-0 max-w-full truncate text-lg tracking-normal">
            {title}
          </h3>
          <p className="font-pixel shrink-0 text-sm">{amount}</p>
        </div>
        <GiftProgress progress={progress} color="#0f766e" />
        <span
          className="mt-3 inline-flex max-w-full rounded-md border-2 border-[#171717] px-2 py-1 text-[11px] font-black"
          style={{ backgroundColor: color }}
        >
          <span className="truncate">받고 싶은 선물</span>
        </span>
      </div>
    </article>
  );
}

function SampleGiftImage({
  tone,
  label,
}: {
  tone: "mint" | "rose";
  label: string;
}) {
  const background = tone === "mint" ? "#ccfbf1" : "#ffe4e6";
  const ribbon = tone === "mint" ? "#f97316" : "#4c1d95";

  return (
    <div
      aria-label={`${label} 선물 이미지`}
      role="img"
      className="relative grid min-h-32 place-items-center border-r-2 border-[#171717]"
      style={{ backgroundColor: background }}
    >
      <div className="relative h-16 w-16 border-2 border-[#171717] bg-white shadow-[4px_4px_0_#111827]">
        <span
          className="absolute left-1/2 top-0 h-full w-3 -translate-x-1/2 border-x-2 border-[#171717]"
          style={{ backgroundColor: ribbon }}
        />
        <span
          className="absolute left-0 top-1/2 h-3 w-full -translate-y-1/2 border-y-2 border-[#171717]"
          style={{ backgroundColor: ribbon }}
        />
        <span className="absolute -top-5 left-2 h-5 w-5 border-2 border-[#171717] bg-white" />
        <span className="absolute -top-5 right-2 h-5 w-5 border-2 border-[#171717] bg-white" />
      </div>
    </div>
  );
}

function GiftProgress({ progress, color }: { progress: string; color: string }) {
  return (
    <div className="mt-3 h-3 overflow-hidden border-2 border-[#171717] bg-[#f3f4f6]">
      <div className="h-full" style={{ width: progress, backgroundColor: color }} />
    </div>
  );
}

function SmallSignal({
  sticker,
  title,
  label,
  progress,
  color,
}: {
  sticker: string;
  title: string;
  label: string;
  progress: string;
  color: string;
}) {
  return (
    <div className="min-w-0 border-2 border-[#171717] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-pixel truncate text-sm tracking-normal">{title}</h2>
          <p className="mt-2 truncate text-sm font-semibold text-[#4b5563]">{label}</p>
        </div>
        <SignalSticker text={sticker} color={color} />
      </div>
      <GiftProgress progress={progress} color="#4c1d95" />
    </div>
  );
}

function SignalSticker({ text, color }: { text: string; color: string }) {
  return (
    <span
      className="font-pixel inline-flex max-w-24 shrink-0 items-center justify-center rounded-md border-2 border-[#171717] px-2 py-1 text-[10px] tracking-normal"
      style={{ backgroundColor: color }}
    >
      <span className="truncate">{text}</span>
    </span>
  );
}
