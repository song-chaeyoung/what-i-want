import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { BRAND_NAME } from "@/src/lib/design/copy";
import { getOnboardingState } from "@/src/lib/onboarding/repository";
import { signInWithGoogle, signInWithKakao } from "./actions";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user?.id) {
    const state = await getOnboardingState(session.user.id);

    if (!state.isComplete) {
      redirect("/onboarding");
    }

    redirect("/admin");
  }

  return (
    <main className="pixel-dot-bg min-h-dvh px-5 py-12 text-[#171717]">
      <div className="mx-auto flex min-h-[calc(100dvh-6rem)] w-full max-w-md flex-col justify-center">
        <Link
          href="/"
          className="mb-6 flex flex-col items-center gap-3 self-center"
        >
          <Image src="/logo.png" alt="" width={72} height={72} priority />
          <span className="font-pixel text-3xl tracking-normal text-[#4c1d95]">
            {BRAND_NAME}
          </span>
        </Link>
        <section className="border-2 border-[#171717] bg-[#fffdf7] p-6 shadow-[6px_6px_0_#111827]">
          <div className="space-y-2">
            <h1 className="font-pixel text-3xl tracking-normal text-[#4c1d95]">
              로그인
            </h1>
            <p className="text-sm leading-6 text-[#4b5563]">
              위시리스트를 만들고 공유하려면 소셜 계정으로 로그인해주세요.
            </p>
          </div>

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
