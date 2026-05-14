import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-dvh bg-[#f7f5f0] text-[#171717]">
      <section className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col justify-center px-6 py-12 sm:px-10">
        <div className="grid gap-10 md:grid-cols-[1.05fr_0.95fr] md:items-center">
          <div className="space-y-8">
            <p className="text-sm font-semibold text-[#0f766e]">
              뭐갖고싶어
            </p>
            <div className="space-y-4">
              <h1 className="max-w-2xl text-5xl font-bold leading-tight tracking-normal sm:text-6xl">
                생일축하해.
                <br />뭐 갖고 싶어?
              </h1>
              <p className="max-w-xl text-lg leading-8 text-[#4b5563]">
                받고 싶은 선물과 계좌 안내를 링크 하나로 정리해 공유하는
                위시리스트 서비스입니다.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-md bg-[#111827] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#0f766e]"
            >
              시작하기
            </Link>
          </div>

          <div className="grid aspect-[4/3] w-full place-items-center border border-[#171717] bg-[#fffdf7] p-6 shadow-[8px_8px_0_#111827]">
            <div className="grid w-full max-w-sm grid-cols-4 gap-3">
              {["#f97316", "#0f766e", "#facc15", "#111827"].map((color) => (
                <div
                  key={color}
                  className="aspect-square border border-[#171717]"
                  style={{ backgroundColor: color }}
                />
              ))}
              <div className="col-span-4 border border-[#171717] bg-white p-5">
                <p className="text-sm font-semibold">birthday-wish</p>
                <p className="mt-2 text-2xl font-bold">민지님의 위시리스트</p>
                <div className="mt-5 h-3 w-full bg-[#e5e7eb]">
                  <div className="h-full w-2/3 bg-[#0f766e]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      </main>
  );
}
