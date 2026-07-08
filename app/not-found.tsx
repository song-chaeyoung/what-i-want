import Link from "next/link";

export default function RootNotFound() {
  return (
    <main className="pixel-dot-bg grid min-h-dvh place-items-center px-5 text-[#171717]">
      <section className="w-full max-w-md space-y-4 rounded-md border-2 border-[#171717] bg-white p-6">
        <p className="sticker-label">404</p>
        <h1 className="font-pixel text-2xl leading-tight text-[#4c1d95]">
          페이지를 찾을 수 없어요
        </h1>
        <p className="text-sm font-semibold leading-6 text-[#4b5563]">
          주소가 잘못되었거나 더 이상 존재하지 않는 페이지예요.
        </p>
        <Link
          href="/"
          className="inline-flex min-h-12 items-center justify-center rounded-md border-2 border-[#171717] bg-[#111827] px-5 py-3 text-sm font-black text-white transition-colors hover:bg-[#0f766e]"
        >
          처음으로
        </Link>
      </section>
    </main>
  );
}
