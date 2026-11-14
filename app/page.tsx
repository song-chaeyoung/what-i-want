import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { auth } from "@/auth";
import { HOME_COPY, HOME_FAQ } from "@/src/lib/design/copy";
import { getOnboardingState } from "@/src/lib/onboarding/repository";

const homeTitle = "생일 선물 펀딩 · 위시리스트 | 뭐갖고싶어";
const homeDescription =
  "친구들과 함께하는 생일 선물 펀딩. 받고 싶은 선물과 목표 금액을 정해 링크로 공유하세요. 친구들은 로그인 없이 축하 메시지를 남기고, 안내된 계좌로 직접 송금할 수 있어요.";

export const metadata: Metadata = {
  title: homeTitle,
  description: homeDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: homeTitle,
    description: homeDescription,
    siteName: "뭐갖고싶어",
    locale: "ko_KR",
    type: "website",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: homeTitle,
    description: homeDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
};

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

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: HOME_FAQ.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export default async function Home() {
  const homeAccountCta = await getHomeAccountCta();

  return (
    <main className="pixel-dot-bg min-h-dvh text-ink">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <section className="mx-auto grid min-h-[calc(100dvh-3rem)] w-full max-w-6xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:py-12">
        <div className="space-y-6">
          <p className="sticker-label max-w-full whitespace-normal break-keep">
            {HOME_COPY.eyebrow}
          </p>
          <div className="space-y-4">
            <h1 className="font-pixel max-w-2xl break-keep text-4xl leading-tight tracking-normal text-purple sm:text-6xl">
              {HOME_COPY.headline}
            </h1>
            <p className="max-w-lg text-base font-semibold leading-7 text-ink-soft sm:text-lg sm:leading-8">
              {HOME_COPY.description}
            </p>
            <p className="max-w-lg text-sm font-semibold leading-6 text-ink-faint">
              {HOME_COPY.subDescription}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="cta" className="sm:px-6">
              <Link href={homeAccountCta.href}>
                <span className="whitespace-normal break-keep">
                  {homeAccountCta.label}
                </span>
              </Link>
            </Button>
            <Button
              asChild
              variant="cta"
              className="bg-white text-ink hover:bg-mint sm:px-6"
            >
              <Link href="/sample">
                <span className="whitespace-normal break-keep">펀딩 예시 보기</span>
              </Link>
            </Button>
          </div>

          <ol
            role="list"
            className="m-0 flex list-none flex-col gap-5 p-0 sm:flex-row sm:gap-4"
          >
            {homeSteps.map((step, index) => (
              <li
                key={step.number}
                className="relative flex min-w-0 flex-1 items-start gap-3 sm:flex-col sm:items-center sm:gap-2 sm:text-center"
              >
                {index < homeSteps.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute top-8 left-4 h-[calc(100%-0.75rem)] w-0 border-l-2 border-dotted border-ink sm:top-4 sm:left-[calc(50%+1rem)] sm:h-0 sm:w-[calc(100%-1rem)] sm:border-t-2 sm:border-l-0"
                  />
                ) : null}
                <span className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full border-2 border-ink bg-[var(--tint-yellow)] font-pixel text-micro leading-none text-accent-main">
                  {step.number}
                </span>
                <div className="min-w-0 pt-1 sm:pt-0">
                  <h2 className="font-pixel truncate text-sm tracking-normal text-purple">
                    {step.title}
                  </h2>
                  <p className="mt-1 truncate text-xs font-black text-ink-soft">
                    {step.label}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <Card variant="pixel" surface="paper" shadow="xs" className="p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-ink pb-4">
            <div className="min-w-0">
              <h2 className="font-pixel mt-1 text-2xl tracking-normal text-purple sm:text-3xl">
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
        </Card>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-14 sm:px-8 lg:pb-20">
        <p className="font-pixel text-sm tracking-normal text-accent-main">FAQ</p>
        <h2 className="font-pixel mt-2 text-3xl tracking-normal text-purple sm:text-4xl">
          자주 묻는 질문
        </h2>
        <div className="mt-6 space-y-3">
          {HOME_FAQ.map((item) => (
            <Card
              key={item.question}
              asChild
              variant="pixel"
              surface="paper"
              shadow="xs"
              className="group"
            >
              <details>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 sm:p-5 [&::-webkit-details-marker]:hidden">
                  <span className="break-keep text-base font-black text-ink sm:text-lg">
                    {item.question}
                  </span>
                  <span
                    aria-hidden="true"
                    className="font-pixel shrink-0 text-xl text-accent-main transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="border-t-2 border-ink p-4 text-sm font-semibold leading-7 text-ink-soft sm:p-5">
                  {item.answer}
                </p>
              </details>
            </Card>
          ))}
        </div>
      </section>

      <SiteFooter variant="full" />
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
    <Card
      asChild
      variant="pixel"
      surface="white"
      shadow="none"
      className="grid grid-cols-[88px_1fr] overflow-hidden sm:grid-cols-[112px_1fr]"
    >
      <article>
        <SampleGiftImage tone={imageTone} label={label} />
        <div className="min-w-0 p-4">
          <p className="font-pixel truncate text-xs text-accent-main">{label}</p>
          <div className="mt-2 flex flex-wrap items-start justify-between gap-2">
            <h3 className="font-pixel min-w-0 max-w-full truncate text-lg tracking-normal">
              {title}
            </h3>
            <p className="font-pixel shrink-0 text-sm">{amount}</p>
          </div>
          <GiftProgress progress={progress} color="#0f766e" />
          <span
            className="mt-3 inline-flex max-w-full rounded-md border-2 border-ink px-2 py-1 text-caption font-black"
            style={{ backgroundColor: color }}
          >
            <span className="truncate">받고 싶은 선물</span>
          </span>
        </div>
      </article>
    </Card>
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
      <div className="relative h-16 w-16 border-2 border-[#171717] bg-white shadow-pixel-xs">
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
    <div className="mt-3 h-3 overflow-hidden border-2 border-ink bg-[#f3f4f6]">
      <div className="h-full" style={{ width: progress, backgroundColor: color }} />
    </div>
  );
}

function SignalSticker({ text, color }: { text: string; color: string }) {
  return (
    <span
      className="font-pixel inline-flex max-w-24 shrink-0 items-center justify-center rounded-md border-2 border-[#171717] px-2 py-1 text-micro tracking-normal"
      style={{ backgroundColor: color }}
    >
      <span className="truncate">{text}</span>
    </span>
  );
}
