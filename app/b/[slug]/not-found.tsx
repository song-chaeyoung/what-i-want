import Link from "next/link";

export default function PublicWishlistNotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#fff7ed] px-5 text-[#171717]">
      <section className="w-full max-w-md border-2 border-[#171717] bg-white p-6 shadow-[8px_8px_0_#111827]">
        <p className="text-sm font-bold text-[#0f766e]">404</p>
        <h1 className="mt-3 text-2xl font-black tracking-normal">
          위시리스트를 찾을 수 없습니다.
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#4b5563]">
          주소가 잘못되었거나 아직 공개되지 않은 위시리스트입니다.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-[#111827] px-4 text-sm font-bold text-white transition-colors hover:bg-[#0f766e]"
        >
          처음으로
        </Link>
      </section>
    </main>
  );
}
