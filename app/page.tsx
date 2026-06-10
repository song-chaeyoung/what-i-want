import Link from "next/link";
import { auth } from "@/auth";
import { HOME_COPY } from "@/src/lib/design/copy";
import { getOnboardingState } from "@/src/lib/onboarding/repository";

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
  { number: "02", title: "공유하기", label: "링크 보내기" },
  { number: "03", title: "마음 받기", label: "메시지 도착" },
] as const;

async function getHomeAccountCta(): Promise<{ label: string; href: string }> {
  const session = await auth();

  if (!session?.user?.id) {
    return { label: HOME_COPY.cta, href: "/login" };
  }

  const state = await getOnboardingState(session.user.id);

  if (!state.isComplete) {
    return { label: "위시리스트 만들기 계속하기", href: "/onboarding" };
  }

  return { label: "내 위시리스트 관리하기", href: "/admin" };
}

export default async function Home() {
  const homeAccountCta = await getHomeAccountCta();

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
            <p className="max-w-lg text-sm font-semibold leading-6 text-[#6b7280]">
              {HOME_COPY.subDescription}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={homeAccountCta.href}
              className="inline-flex min-h-12 max-w-full items-center justify-center rounded-md border-2 border-[#171717] bg-[#111827] px-5 py-3 text-center text-sm font-black text-white transition-colors hover:bg-[#0f766e] sm:px-6"
            >
              <span className="whitespace-normal break-keep">
                {homeAccountCta.label}
              </span>
            </Link>
            <Link
              href="/sample"
              className="inline-flex min-h-12 max-w-full items-center justify-center rounded-md border-2 border-[#171717] bg-white px-5 py-3 text-center text-sm font-black transition-colors hover:bg-[#ccfbf1] sm:px-6"
            >
              <span className="whitespace-normal break-keep">샘플 보기</span>
            </Link>
          </div>
        </div>

        <div className="border-2 border-[#171717] bg-[#fffdf7] p-4 shadow-[6px_6px_0_#111827] sm:p-5 lg:row-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-[#171717] pb-4">
            <div className="min-w-0">
              <h2 className="font-pixel mt-1 text-2xl tracking-normal text-[#4c1d95] sm:text-3xl">
                민지님의 공개 위시리스트
              </h2>
            </div>
            <SignalSticker text="SAMPLE" color="#f97316" />
          </div>

          <div className="mt-5 grid gap-4">
            {previewWishes.map((wish) => (
              <PreviewWish key={wish.title} {...wish} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
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
