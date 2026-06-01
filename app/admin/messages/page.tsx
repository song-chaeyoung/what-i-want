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
    <section className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-teal">
            /b/{result.wishlist.slug}
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-normal">메시지함</h2>
        </div>
        <p className="text-sm font-semibold text-zinc-600">
          {result.messages.length}개
        </p>
      </div>

      <div className="space-y-4">
        {result.messages.length > 0 ? (
          result.messages.map((message) => (
            <MessageCard key={message.id} message={message} />
          ))
        ) : (
          <div className="rounded-md border border-line bg-white p-6 shadow-pub">
            <p className="text-sm font-semibold">아직 메시지가 없습니다.</p>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              공개 페이지에서 친구가 마음을 보내면 여기에 표시됩니다.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function MessageCard({ message }: { message: AdminMessageRecord }) {
  return (
    <article className="items-start rounded-md border border-line bg-white p-5 shadow-pub">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-teal">
            {message.wishTitle ?? "선물 없음"}
          </p>
          <h3 className="mt-1 text-lg font-extrabold tracking-normal text-ink">
            {message.senderName ?? "익명"}
          </h3>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-sm font-bold text-ink">
            {message.amount ? formatCurrency(message.amount) : "금액 없음"}
          </p>
          <p className="mt-1 text-xs font-semibold text-zinc-500">
            {formatDate(message.createdAt)}
          </p>
        </div>
      </div>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
        {message.body}
      </p>
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
