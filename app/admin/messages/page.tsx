import Link from "next/link";
import { requireUser } from "@/src/lib/auth/require-user";
import { DrizzleAdminMessagesRepository } from "@/src/lib/admin-messages/repository";
import { listAdminMessages } from "@/src/lib/admin-messages/service";
import type { AdminMessageRecord } from "@/src/lib/admin-messages/types";

const errorMessages: Record<string, string> = {
  wishlist_not_found: "먼저 온보딩을 완료해주세요.",
};

export default async function AdminMessagesPage() {
  const user = await requireUser();
  const result = await listAdminMessages(
    user.id,
    new DrizzleAdminMessagesRepository(),
  );

  if (!result.ok) {
    return (
      <section>
        <div className="rounded-md border border-orange/40 bg-[#fff7ed] p-5 text-sm font-medium text-[#9a3412]">
          {errorMessages[result.error]}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-teal">
            /b/{result.wishlist.slug}
          </p>
          <h2 className="mt-1 text-xl font-extrabold tracking-normal text-ink">
            메시지함
          </h2>
        </div>
        <Link
          href={`/b/${result.wishlist.slug}`}
          className="inline-flex h-9 self-start items-center justify-center rounded-md border border-line bg-white px-3 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-100"
        >
          공개 페이지 보기
        </Link>
      </div>

      <div className="rounded-md border border-line bg-[#fbfbfa] px-3.5 py-3">
        <p className="text-xs font-semibold text-zinc-500">받은 메시지</p>
        <p className="mt-1 text-xl font-extrabold text-ink">
          {result.messages.length}개
        </p>
      </div>

      {result.messages.length > 0 ? (
        <div className="divide-y divide-line rounded-md border border-line bg-white">
          {result.messages.map((message) => (
            <MessageRow key={message.id} message={message} />
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-line bg-white p-4">
          <p className="text-sm font-semibold">아직 메시지가 없습니다.</p>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            공개 페이지에서 친구가 마음을 보내면 여기에 표시됩니다.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link
              href={`/b/${result.wishlist.slug}`}
              className="inline-flex h-9 items-center justify-center rounded-md border border-ink bg-ink px-3 text-sm font-semibold text-white transition-colors hover:bg-black"
            >
              공개 페이지 보기
            </Link>
            <Link
              href="/admin/wishes"
              className="inline-flex h-9 items-center justify-center rounded-md border border-line bg-white px-3 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-100"
            >
              선물 관리하기
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

function MessageRow({ message }: { message: AdminMessageRecord }) {
  return (
    <article className="grid gap-3 px-3.5 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="rounded-full border border-[#f3d7c7] bg-[#fffaf7] px-2 py-0.5 text-xs font-semibold text-[#9a3412]">
            {message.wishTitle ?? "선물 없음"}
          </span>
          <span className="text-xs font-semibold text-zinc-500">
            {formatDate(message.createdAt)}
          </span>
        </div>
        <h3 className="mt-2 text-sm font-bold tracking-normal text-ink">
          {message.senderName ?? "익명"}
        </h3>
        <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-sm leading-6 text-zinc-600">
          {message.body}
        </p>
      </div>
      <div className="text-sm font-bold text-ink sm:text-right">
        {message.amount ? formatCurrency(message.amount) : "금액 없음"}
      </div>
    </article>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}
