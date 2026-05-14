import Link from "next/link";

export default function AdminPage() {
  return (
    <section className="py-8">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="border border-[#171717] bg-white p-5 shadow-[4px_4px_0_#111827]">
          <p className="text-sm font-semibold text-[#0f766e]">기본 목록</p>
          <h2 className="mt-2 text-xl font-bold tracking-normal">
            공개 위시리스트
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#4b5563]">
            선물을 등록하고 상태를 관리한 뒤 공개 링크로 공유합니다.
          </p>
          <Link
            href="/admin/wishes"
            className="mt-5 inline-flex h-10 items-center rounded-md bg-[#111827] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0f766e]"
          >
            선물 관리하기
          </Link>
        </div>
        <div className="border border-[#d1d5db] bg-white p-5">
          <p className="text-sm font-semibold">선물</p>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>
        <div className="border border-[#d1d5db] bg-white p-5">
          <p className="text-sm font-semibold">메시지</p>
          <p className="mt-2 text-3xl font-bold">0</p>
        </div>
      </div>
    </section>
  );
}
