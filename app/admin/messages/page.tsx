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
      <section className="py-8">
        <div className="border border-[#f97316] bg-[#fff7ed] p-5 text-sm font-medium text-[#9a3412]">
          {errorMessages[result.error]}
        </div>
      </section>
    );
  }

  return (
    <section className="py-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#0f766e]">
            /b/{result.wishlist.slug}
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-normal">메시지함</h2>
        </div>
        <p className="text-sm font-semibold text-[#4b5563]">
          {result.messages.length}개
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {result.messages.length > 0 ? (
          result.messages.map((message) => (
            <MessageCard key={message.id} message={message} />
          ))
        ) : (
          <div className="border border-[#d1d5db] bg-white p-6">
            <p className="text-sm font-semibold">아직 메시지가 없습니다.</p>
            <p className="mt-2 text-sm leading-6 text-[#4b5563]">
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
    <article className="border border-[#d1d5db] bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-[#0f766e]">
            {message.wishTitle ?? "선물 없음"}
          </p>
          <h3 className="mt-1 text-lg font-bold tracking-normal">
            {message.senderName ?? "익명"}
          </h3>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-sm font-bold">
            {message.amount ? formatCurrency(message.amount) : "금액 없음"}
          </p>
          <p className="mt-1 text-xs font-semibold text-[#6b7280]">
            {formatDate(message.createdAt)}
          </p>
        </div>
      </div>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#374151]">
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
