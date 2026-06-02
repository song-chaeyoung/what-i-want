import Link from "next/link";
import { requireUser } from "@/src/lib/auth/require-user";
import { DrizzleWishRepository } from "@/src/lib/wishes/repository";
import { listWishes } from "@/src/lib/wishes/service";
import type { WishItemRecord } from "@/src/lib/wishes/types";
import { getWishStatusLabel, type WishStatus } from "@/src/lib/wish-item/status";
import {
  AdminField,
  AdminMetric,
  AdminNotice,
  AdminOverviewCard,
  AdminPageHeader,
  adminInputClassName,
  adminTextareaClassName,
} from "../admin-ui";

type AdminWishesPageProps = {
  searchParams: Promise<{
    error?: string;
    created?: string;
    updated?: string;
    deleted?: string;
    status?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  wishlist_not_found: "먼저 온보딩을 완료해주세요.",
  wish_not_found: "수정할 선물을 찾을 수 없습니다.",
  title_required: "선물 이름을 입력해주세요.",
  title_too_long: "선물 이름은 120자 이하여야 합니다.",
  invalid_target_amount: "목표 금액은 0 이상의 정수로 입력해주세요.",
  invalid_product_url: "상품 링크는 http 또는 https 주소여야 합니다.",
  invalid_image_url: "이미지 링크는 http 또는 https 주소여야 합니다.",
  invalid_status: "지원하지 않는 선물 상태입니다.",
};

const statusOptions: WishStatus[] = ["open", "paused", "fulfilled", "hidden"];

const statusBadgeClassNames: Record<WishStatus, string> = {
  open: "border-[#bbf7d0] bg-[#ecfdf5] text-[#047857]",
  paused: "border-[#fed7aa] bg-[#fff7ed] text-[#9a3412]",
  fulfilled: "border-[#dbeafe] bg-[#eff6ff] text-[#1d4ed8]",
  hidden: "border-zinc-200 bg-[#f4f4f5] text-zinc-600",
};

const statusDotClassNames: Record<WishStatus, string> = {
  open: "bg-[#10b981]",
  paused: "bg-[#f97316]",
  fulfilled: "bg-[#3b82f6]",
  hidden: "bg-zinc-400",
};

export default async function AdminWishesPage({
  searchParams,
}: AdminWishesPageProps) {
  const user = await requireUser();
  const [params, result] = await Promise.all([
    searchParams,
    listWishes(user.id, new DrizzleWishRepository()),
  ]);

  const errorMessage = params.error ? errorMessages[params.error] : null;
  const successMessage = getSuccessMessage(params);
  const selectedStatus = getSelectedStatus(params.status);

  if (!result.ok) {
    return (
      <section>
        <AdminNotice>{errorMessages[result.error]}</AdminNotice>
      </section>
    );
  }

  const visibleItems = selectedStatus
    ? result.items.filter((item) => item.status === selectedStatus)
    : result.items;
  const totalFundedAmount = result.items.reduce(
    (sum, item) => sum + item.fundedAmount,
    0,
  );
  const statusCounts: Record<WishStatus, number> = {
    open: 0,
    paused: 0,
    fulfilled: 0,
    hidden: 0,
  };
  for (const item of result.items) {
    statusCounts[item.status] += 1;
  }
  const emptyStateMessage = selectedStatus
    ? `${getWishStatusLabel(selectedStatus)} 상태의 선물이 없습니다.`
    : "등록된 선물이 없습니다.";
  const emptyStateCta = selectedStatus ? "전체 선물 보기" : "선물 추가하기";
  const emptyStateHref = selectedStatus ? "/admin/wishes" : "#create-wish";

  return (
    <section className="space-y-4">
      <AdminOverviewCard
        header={
          <AdminPageHeader
            slug={result.wishlist.slug}
            title="선물 관리"
            description="등록된 선물과 모인 금액을 빠르게 확인하고 관리합니다."
          />
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <AdminMetric
            label="총 선물"
            value={`${result.items.length}개`}
          />
          <AdminMetric
            label="모인 금액"
            value={formatCurrency(totalFundedAmount)}
          />
        </div>
      </AdminOverviewCard>

      <nav
        aria-label="선물 상태 필터"
        className="flex overflow-x-auto rounded-md border border-line bg-white p-1"
      >
        <Link
          href="/admin/wishes"
          className={`flex h-9 flex-none items-center gap-2 rounded-[7px] px-3 text-sm font-semibold transition-colors ${
            selectedStatus
              ? "text-zinc-600 hover:bg-[#fafaf9]"
              : "bg-[#f4f4f3] text-ink"
          }`}
        >
          전체
          <span className="rounded bg-white/80 px-1.5 text-xs text-zinc-500">
            {result.items.length}
          </span>
        </Link>
        {statusOptions.map((status) => (
          <Link
            key={status}
            href={`/admin/wishes?status=${status}`}
            className={`flex h-9 flex-none items-center gap-2 rounded-[7px] px-3 text-sm font-semibold transition-colors ${
              selectedStatus === status
                ? "bg-[#f4f4f3] text-ink"
                : "text-zinc-600 hover:bg-[#fafaf9]"
            }`}
          >
            {getWishStatusLabel(status)}
            <span className="rounded bg-white/80 px-1.5 text-xs text-zinc-500">
              {statusCounts[status]}
            </span>
          </Link>
        ))}
      </nav>

      {errorMessage ? (
        <AdminNotice>{errorMessage}</AdminNotice>
      ) : null}

      {successMessage ? (
        <AdminNotice tone="success">{successMessage}</AdminNotice>
      ) : null}

      <details
        id="create-wish"
        open={result.items.length === 0 && !selectedStatus}
        className="rounded-md border border-line bg-white"
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3 text-sm font-semibold text-ink transition-colors hover:bg-[#fafaf9] [&::-webkit-details-marker]:hidden">
          <span>선물 추가</span>
          <span className="rounded-md border border-line bg-[#fbfbfa] px-2 py-1 text-xs text-zinc-600">
            입력
          </span>
        </summary>
        <form
          action="/api/admin/wishes"
          method="post"
          className="grid gap-4 border-t border-line bg-[#fbfbfa] p-4 md:grid-cols-2"
        >
          <AdminField label="선물 이름" htmlFor="create-title">
            <input
              id="create-title"
              name="title"
              type="text"
              maxLength={120}
              required
              className={adminInputClassName}
            />
          </AdminField>

          <AdminField label="목표 금액" htmlFor="create-targetAmount">
            <input
              id="create-targetAmount"
              name="targetAmount"
              type="number"
              min={0}
              step={1}
              placeholder="45000"
              className={adminInputClassName}
            />
          </AdminField>

          <AdminField label="상품 링크" htmlFor="create-productUrl">
            <input
              id="create-productUrl"
              name="productUrl"
              type="url"
              placeholder="https://..."
              className={adminInputClassName}
            />
          </AdminField>

          <AdminField label="이미지 링크" htmlFor="create-imageUrl">
            <input
              id="create-imageUrl"
              name="imageUrl"
              type="url"
              placeholder="https://..."
              className={adminInputClassName}
            />
          </AdminField>

          <div className="md:col-span-2">
            <AdminField label="메모" htmlFor="create-description">
              <textarea
                id="create-description"
                name="description"
                rows={3}
                className={adminTextareaClassName}
              />
            </AdminField>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="h-10 rounded-md border border-teal bg-teal px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0f766e]"
            >
              추가하기
            </button>
          </div>
        </form>
      </details>

      <section className="space-y-2">
        {visibleItems.length > 0 ? (
          visibleItems.map((item) => <WishItemEditor key={item.id} item={item} />)
        ) : (
          <div className="rounded-md border border-line bg-white p-4">
            <p className="text-sm font-semibold text-ink">{emptyStateMessage}</p>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              {selectedStatus
                ? "다른 상태 탭으로 전환하거나 전체 목록에서 선물을 확인해주세요."
                : "위의 선물 추가 패널에서 첫 선물을 등록해주세요."}
            </p>
            <Link
              href={emptyStateHref}
              className="mt-4 inline-flex h-9 items-center rounded-md border border-teal bg-white px-3 text-sm font-semibold text-teal transition-colors hover:bg-[#ecfdf5]"
            >
              {emptyStateCta}
            </Link>
          </div>
        )}
      </section>
    </section>
  );
}

function WishItemEditor({ item }: { item: WishItemRecord }) {
  const progress =
    item.targetAmount && item.targetAmount > 0
      ? Math.min(100, Math.floor((item.fundedAmount / item.targetAmount) * 100))
      : 0;

  return (
    <details className="rounded-md border border-line bg-white">
      <summary className="flex cursor-pointer list-none items-start gap-3 p-3 transition-colors hover:bg-[#fafaf9] [&::-webkit-details-marker]:hidden">
        <WishThumbnail item={item} />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="truncate text-sm font-bold tracking-normal text-ink">
              {item.title}
            </h3>
            <span
              className={`inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full border px-2 text-xs font-bold ${statusBadgeClassNames[item.status]}`}
            >
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 rounded-full ${statusDotClassNames[item.status]}`}
              />
              {getWishStatusLabel(item.status)}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-600">
            {formatCurrency(item.fundedAmount)} /{" "}
            {item.targetAmount ? formatCurrency(item.targetAmount) : "목표 금액 없음"}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-100">
            <div className="h-full rounded-full bg-teal" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <span className="shrink-0 rounded-md border border-line bg-[#fbfbfa] px-2 py-1 text-xs font-semibold text-zinc-600">
          수정
        </span>
      </summary>

      <div className="border-t border-line bg-[#fbfbfa] p-3">
        <form
          action={`/api/admin/wishes/${item.id}`}
          method="post"
          className="grid gap-4 md:grid-cols-2"
        >
          <input type="hidden" name="_method" value="patch" />
          <AdminField label="선물 이름" htmlFor={`title-${item.id}`}>
            <input
              id={`title-${item.id}`}
              name="title"
              type="text"
              maxLength={120}
              required
              defaultValue={item.title}
              className={adminInputClassName}
            />
          </AdminField>

          <AdminField label="상태" htmlFor={`status-${item.id}`}>
            <select
              id={`status-${item.id}`}
              name="status"
              defaultValue={item.status}
              className={adminInputClassName}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {getWishStatusLabel(status)}
                </option>
              ))}
            </select>
          </AdminField>

          <AdminField label="목표 금액" htmlFor={`targetAmount-${item.id}`}>
            <input
              id={`targetAmount-${item.id}`}
              name="targetAmount"
              type="number"
              min={0}
              step={1}
              defaultValue={item.targetAmount ?? ""}
              className={adminInputClassName}
            />
          </AdminField>

          <AdminField label="상품 링크" htmlFor={`productUrl-${item.id}`}>
            <input
              id={`productUrl-${item.id}`}
              name="productUrl"
              type="url"
              defaultValue={item.productUrl ?? ""}
              className={adminInputClassName}
            />
          </AdminField>

          <AdminField label="이미지 링크" htmlFor={`imageUrl-${item.id}`}>
            <input
              id={`imageUrl-${item.id}`}
              name="imageUrl"
              type="url"
              defaultValue={item.imageUrl ?? ""}
              className={adminInputClassName}
            />
          </AdminField>

          <div className="md:col-span-2">
            <AdminField label="메모" htmlFor={`description-${item.id}`}>
              <textarea
                id={`description-${item.id}`}
                name="description"
                rows={3}
                defaultValue={item.description ?? ""}
                className={adminTextareaClassName}
              />
            </AdminField>
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              className="h-10 rounded-md border border-teal bg-teal px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0f766e]"
            >
              저장
            </button>
          </div>
        </form>

        <form action={`/api/admin/wishes/${item.id}`} method="post" className="mt-3">
          <input type="hidden" name="_method" value="delete" />
          <button
            type="submit"
            className="h-9 rounded-md border border-[#b91c1c] bg-white px-3 text-sm font-semibold text-[#b91c1c] transition-colors hover:bg-[#fef2f2]"
          >
            삭제
          </button>
        </form>
      </div>
    </details>
  );
}

function WishThumbnail({ item }: { item: WishItemRecord }) {
  return (
    <div
      aria-hidden="true"
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-line bg-[#f4f4f3] bg-cover bg-center text-[11px] font-bold text-teal"
      style={
        item.imageUrl
          ? { backgroundImage: `url(${JSON.stringify(item.imageUrl)})` }
          : undefined
      }
    >
      {item.imageUrl ? null : "선물"}
    </div>
  );
}

function getSelectedStatus(value: string | undefined): WishStatus | null {
  return statusOptions.find((status) => status === value) ?? null;
}

function getSuccessMessage(params: {
  created?: string;
  updated?: string;
  deleted?: string;
}): string | null {
  if (params.created) {
    return "선물이 추가되었습니다.";
  }
  if (params.updated) {
    return "선물이 저장되었습니다.";
  }
  if (params.deleted) {
    return "선물이 삭제되었습니다.";
  }
  return null;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(amount);
}
