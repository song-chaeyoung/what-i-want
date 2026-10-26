import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { TextLogo } from "@/components/text-logo";
import { getOnboardingState } from "@/src/lib/onboarding/repository";
import { signInWithGoogle, signInWithKakao } from "./actions";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type LoginPageProps = {
  searchParams: Promise<{
    notice?: string;
  }>;
};

const noticeMessages: Record<string, string> = {
  under_minimum_age:
    "만 14세 미만은 가입할 수 없어 로그인 정보를 삭제했어요. 생일 연도를 잘못 고르셨다면 다시 로그인해주세요.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();

  if (session?.user?.id) {
    const state = await getOnboardingState(session.user.id);

    if (!state.isComplete) {
      redirect("/onboarding");
    }

    redirect("/admin");
  }

  const { notice } = await searchParams;
  // 쿼리값으로 constructor 등 상속 속성이 조회되지 않게 자기 키만 허용한다.
  const noticeMessage =
    notice && Object.hasOwn(noticeMessages, notice)
      ? noticeMessages[notice]
      : null;

  return (
    <main className="pixel-dot-bg min-h-dvh px-5 py-12 text-[#171717]">
      <div className="mx-auto flex min-h-[calc(100dvh-6rem)] w-full max-w-md flex-col justify-center">
        <TextLogo href="/" className="mb-6 self-center" />
        <section className="border-2 border-[#171717] bg-[#fffdf7] p-6 shadow-[6px_6px_0_#111827]">
          <div className="space-y-2">
            <h1 className="font-pixel text-3xl tracking-normal text-[#4c1d95]">
              로그인
            </h1>
            <p className="text-sm leading-6 text-[#4b5563]">
              위시리스트를 만들고 공유하려면 소셜 계정으로 로그인해주세요.
            </p>
            <p className="text-sm leading-6 text-[#4b5563]">
              만 14세 이상만 가입할 수 있어요.
            </p>
          </div>

          {noticeMessage ? (
            <p className="mt-5 border-2 border-[#f97316] bg-[#fff7ed] px-4 py-3 text-sm font-black text-[#9a3412]">
              {noticeMessage}
            </p>
          ) : null}

          <div className="mt-8 space-y-3">
            <form action={signInWithGoogle}>
              <button
                type="submit"
                className="h-12 w-full rounded-md border-2 border-[#171717] bg-white px-4 text-sm font-black transition-colors hover:bg-[#f3f4f6]"
              >
                Google로 계속하기
              </button>
            </form>
            <form action={signInWithKakao}>
              <button
                type="submit"
                className="h-12 w-full rounded-md border-2 border-[#171717] bg-[#fee500] px-4 text-sm font-black text-[#171717] transition-colors hover:bg-[#f6dc00]"
              >
                Kakao로 계속하기
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
