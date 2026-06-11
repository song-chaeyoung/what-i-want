import Link from "next/link";
import { requireUser } from "@/src/lib/auth/require-user";
import { DrizzleAdminMessagesRepository } from "@/src/lib/admin-messages/repository";
import { listAdminMessages } from "@/src/lib/admin-messages/service";
import type { AdminMessageRecord } from "@/src/lib/admin-messages/types";
import { AdminToastMessage } from "../admin-toast-message";
import {
  AdminMetric,
  AdminMetricGroup,
  adminPrimaryButtonClassName,
  adminSecondaryButtonClassName,
  formatCurrency,
} from "../admin-ui";

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
        <AdminToastMessage
          id={`admin-messages-${result.error}`}
          message={errorMessages[result.error]}
        />
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <AdminMetricGroup>
        <AdminMetric label="받은 메시지" value={`${result.messages.length}개`} />
      </AdminMetricGroup>

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
              href={`/wishlist/${result.wishlist.slug}`}
              className={adminPrimaryButtonClassName}
            >
              공개 페이지 보기
            </Link>
            <Link href="/admin/wishes" className={adminSecondaryButtonClassName}>
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
          <span className="rounded-full bg-[#fff7ed] px-2 py-0.5 text-xs font-semibold text-[#9a3412]">
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

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}
