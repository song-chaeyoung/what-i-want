import Link from "next/link";

export default function AdminPage() {
  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-md border border-line bg-white p-5 shadow-pub">
          <p className="text-sm font-semibold text-teal">기본 목록</p>
          <h2 className="mt-2 text-xl font-extrabold tracking-normal text-ink">
            공개 위시리스트
          </h2>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            선물을 등록하고 상태를 관리한 뒤 공개 링크로 공유합니다.
          </p>
          <Link
            href="/admin/wishes"
            className="mt-5 inline-flex h-10 items-center rounded-md border border-ink bg-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-black"
          >
            선물 관리하기
          </Link>
        </div>
        <SummaryCard label="선물" value="0" />
        <SummaryCard label="메시지" value="0" />
      </div>
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-line bg-white p-5 shadow-pub">
      <p className="text-sm font-semibold text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-ink">{value}</p>
    </div>
  );
}
