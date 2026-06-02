import Link from "next/link";
import { DrizzleAdminMessagesRepository } from "@/src/lib/admin-messages/repository";
import { listAdminMessages } from "@/src/lib/admin-messages/service";
import type { AdminMessageRecord } from "@/src/lib/admin-messages/types";
import { requireUser } from "@/src/lib/auth/require-user";
import { DrizzleWishRepository } from "@/src/lib/wishes/repository";
import { listWishes } from "@/src/lib/wishes/service";
import type { WishItemRecord } from "@/src/lib/wishes/types";
import {
  AdminMetric,
  AdminNotice,
  AdminOverviewCard,
  AdminPageHeader,
} from "./admin-ui";

const errorMessages: Record<string, string> = {
  wishlist_not_found: "먼저 온보딩을 완료해주세요.",
};

export default async function AdminPage() {
  const user = await requireUser();
  const [wishesResult, messagesResult] = await Promise.all([
    listWishes(user.id, new DrizzleWishRepository()),
    listAdminMessages(user.id, new DrizzleAdminMessagesRepository()),
  ]);

  if (!wishesResult.ok) {
    return (
      <section>
        <AdminNotice>{errorMessages[wishesResult.error]}</AdminNotice>
      </section>
    );
  }

  if (!messagesResult.ok) {
    return (
      <section>
        <AdminNotice>{errorMessages[messagesResult.error]}</AdminNotice>
      </section>
    );
  }

  const totalFundedAmount = wishesResult.items.reduce(
    (sum, item) => sum + item.fundedAmount,
    0,
  );
  const recentWishes = wishesResult.items.slice(0, 4);
  const recentMessages = messagesResult.messages.slice(0, 4);

  return (
    <section className="space-y-4">
      <AdminOverviewCard
        header={
          <AdminPageHeader
            eyebrow="Overview"
            title="공개 위시리스트"
            description="선물 등록, 메시지 확인, 모인 금액을 한 화면에서 빠르게 점검합니다."
            actionHref="/admin/wishes"
            actionLabel="선물 관리하기"
            actionVariant="primary"
          />
        }
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <AdminMetric
            label="선물"
            value={`${wishesResult.items.length}개`}
            detail="등록된 공개 항목"
          />
          <AdminMetric
            label="메시지"
            value={`${messagesResult.messages.length}개`}
            detail="도착한 마음"
          />
          <AdminMetric
            label="모인 금액"
            value={formatCurrency(totalFundedAmount)}
            detail="전체 선물 기준"
          />
        </div>
      </AdminOverviewCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardQueue
          title="최근 선물"
          actionHref="/admin/wishes"
          actionLabel="전체 보기"
          emptyTitle="등록된 선물이 없습니다."
          emptyDescription="첫 선물을 추가하면 운영 목록과 공개 페이지에 바로 반영됩니다."
          emptyActionHref="/admin/wishes"
          emptyActionLabel="선물 추가"
        >
          {recentWishes.map((wish) => (
            <DashboardQueueRow
              key={wish.id}
              label={wish.title}
              meta={formatWishAmount(wish)}
              value={formatDate(wish.updatedAt)}
            />
          ))}
        </DashboardQueue>

        <DashboardQueue
          title="최근 메시지"
          actionHref="/admin/messages"
          actionLabel="메시지함"
          emptyTitle="아직 메시지가 없습니다."
          emptyDescription="공개 페이지에서 마음이 도착하면 이곳에서 빠르게 확인합니다."
          emptyActionHref={`/b/${wishesResult.wishlist.slug}`}
          emptyActionLabel="공개 페이지 보기"
        >
          {recentMessages.map((message) => (
            <DashboardQueueRow
              key={message.id}
              label={message.senderName ?? "익명"}
              meta={formatMessageMeta(message)}
              value={formatDate(message.createdAt)}
            />
          ))}
        </DashboardQueue>
      </div>
    </section>
  );
}

function DashboardQueue({
  title,
  actionHref,
  actionLabel,
  emptyTitle,
  emptyDescription,
  emptyActionHref,
  emptyActionLabel,
  children,
}: {
  title: string;
  actionHref: string;
  actionLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  emptyActionHref: string;
  emptyActionLabel: string;
  children: React.ReactNode;
}) {
  const hasRows = Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <section className="rounded-md border border-line bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-line px-3.5 py-3">
        <h3 className="text-sm font-bold tracking-normal text-ink">{title}</h3>
        <Link
          href={actionHref}
          className="text-xs font-semibold text-teal transition-colors hover:text-[#0f766e]"
        >
          {actionLabel}
        </Link>
      </div>
      {hasRows ? (
        <div className="divide-y divide-line">{children}</div>
      ) : (
        <div className="p-4">
          <p className="text-sm font-semibold text-ink">{emptyTitle}</p>
          <p className="mt-1 text-sm leading-6 text-zinc-600">{emptyDescription}</p>
          <Link
            href={emptyActionHref}
            className="mt-3 inline-flex h-8 items-center rounded-md border border-line bg-[#fbfbfa] px-3 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-100"
          >
            {emptyActionLabel}
          </Link>
        </div>
      )}
    </section>
  );
}

function DashboardQueueRow({
  label,
  meta,
  value,
}: {
  label: string;
  meta: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-3 px-3.5 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink">{label}</p>
        <p className="mt-0.5 truncate text-xs text-zinc-500">{meta}</p>
      </div>
      <span className="text-xs font-semibold text-zinc-400">{value}</span>
    </div>
  );
}

function formatWishAmount(wish: WishItemRecord): string {
  if (!wish.targetAmount) {
    return `${formatCurrency(wish.fundedAmount)} 모임`;
  }

  return `${formatCurrency(wish.fundedAmount)} / ${formatCurrency(wish.targetAmount)}`;
}

function formatMessageMeta(message: AdminMessageRecord): string {
  const amount = message.amount ? formatCurrency(message.amount) : "금액 없음";

  return `${message.wishTitle ?? "선물 없음"} · ${amount}`;
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
  }).format(value);
}
