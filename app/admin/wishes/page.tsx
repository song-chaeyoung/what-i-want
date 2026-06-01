import Link from "next/link";
import { requireUser } from "@/src/lib/auth/require-user";
import { DrizzleWishRepository } from "@/src/lib/wishes/repository";
import { listWishes } from "@/src/lib/wishes/service";
import type { WishItemRecord } from "@/src/lib/wishes/types";
import { getWishStatusLabel, type WishStatus } from "@/src/lib/wish-item/status";

type AdminWishesPageProps = {
  searchParams: Promise<{
    error?: string;
    created?: string;
    updated?: string;
    deleted?: string;
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-teal">
            /b/{result.wishlist.slug}
          </p>
          <h2 className="mt-2 text-2xl font-extrabold tracking-normal text-ink">
            선물 관리
          </h2>
        </div>
        <Link
          href={`/b/${result.wishlist.slug}`}
          className="inline-flex h-10 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-100"
        >
          공개 페이지 보기
        </Link>
      </div>

      {errorMessage ? (
        <p className="rounded-md border border-orange/40 bg-[#fff7ed] px-4 py-3 text-sm font-medium text-[#9a3412]">
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p className="rounded-md border border-teal/30 bg-[#ecfdf5] px-4 py-3 text-sm font-medium text-teal">
          {successMessage}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <section className="rounded-md border border-line bg-white p-5 shadow-pub">
          <h3 className="text-lg font-bold tracking-normal">선물 추가</h3>
          <form action="/api/admin/wishes" method="post" className="mt-5 space-y-4">
            <Field label="선물 이름" htmlFor="create-title">
              <input
                id="create-title"
                name="title"
                type="text"
                maxLength={120}
                required
                className={inputClassName}
              />
            </Field>

            <Field label="목표 금액" htmlFor="create-targetAmount">
              <input
                id="create-targetAmount"
                name="targetAmount"
                type="number"
                min={0}
                step={1}
                placeholder="45000"
                className={inputClassName}
              />
            </Field>

            <Field label="상품 링크" htmlFor="create-productUrl">
              <input
                id="create-productUrl"
                name="productUrl"
                type="url"
                placeholder="https://..."
                className={inputClassName}
              />
            </Field>

            <Field label="이미지 링크" htmlFor="create-imageUrl">
              <input
                id="create-imageUrl"
                name="imageUrl"
                type="url"
                placeholder="https://..."
                className={inputClassName}
              />
            </Field>

            <Field label="메모" htmlFor="create-description">
              <textarea
                id="create-description"
                name="description"
                rows={4}
                className={textareaClassName}
              />
            </Field>

            <button
              type="submit"
              className="h-11 w-full rounded-md border border-ink bg-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-black"
            >
              추가하기
            </button>
          </form>
        </section>

        <section className="space-y-4">
          {result.items.length > 0 ? (
            result.items.map((item) => <WishItemEditor key={item.id} item={item} />)
          ) : (
            <div className="rounded-md border border-line bg-white p-6 shadow-pub">
              <p className="text-sm font-semibold text-ink">
                등록된 선물이 없습니다.
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                왼쪽 입력 영역에서 첫 번째 선물을 추가해주세요.
              </p>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

function WishItemEditor({ item }: { item: WishItemRecord }) {
  const progress =
    item.targetAmount && item.targetAmount > 0
      ? Math.min(100, Math.floor((item.fundedAmount / item.targetAmount) * 100))
      : 0;

  return (
    <article className="rounded-md border border-line bg-white p-5 shadow-pub">
      <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-teal">
            {getWishStatusLabel(item.status)}
          </p>
          <h3 className="mt-1 text-lg font-extrabold tracking-normal text-ink">
            {item.title}
          </h3>
          <p className="mt-2 text-sm text-zinc-600">
            {formatCurrency(item.fundedAmount)} /{" "}
            {item.targetAmount
              ? formatCurrency(item.targetAmount)
              : "목표 금액 없음"}
          </p>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 sm:w-40">
          <div className="h-full rounded-full bg-teal" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <form
        action={`/api/admin/wishes/${item.id}`}
        method="post"
        className="mt-5 grid gap-4 md:grid-cols-2"
      >
        <input type="hidden" name="_method" value="patch" />
        <Field label="선물 이름" htmlFor={`title-${item.id}`}>
          <input
            id={`title-${item.id}`}
            name="title"
            type="text"
            maxLength={120}
            required
            defaultValue={item.title}
            className={inputClassName}
          />
        </Field>

        <Field label="상태" htmlFor={`status-${item.id}`}>
          <select
            id={`status-${item.id}`}
            name="status"
            defaultValue={item.status}
            className={inputClassName}
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {getWishStatusLabel(status)}
              </option>
            ))}
          </select>
        </Field>

        <Field label="목표 금액" htmlFor={`targetAmount-${item.id}`}>
          <input
            id={`targetAmount-${item.id}`}
            name="targetAmount"
            type="number"
            min={0}
            step={1}
            defaultValue={item.targetAmount ?? ""}
            className={inputClassName}
          />
        </Field>

        <Field label="상품 링크" htmlFor={`productUrl-${item.id}`}>
          <input
            id={`productUrl-${item.id}`}
            name="productUrl"
            type="url"
            defaultValue={item.productUrl ?? ""}
            className={inputClassName}
          />
        </Field>

        <Field label="이미지 링크" htmlFor={`imageUrl-${item.id}`}>
          <input
            id={`imageUrl-${item.id}`}
            name="imageUrl"
            type="url"
            defaultValue={item.imageUrl ?? ""}
            className={inputClassName}
          />
        </Field>

        <div className="md:col-span-2">
          <Field label="메모" htmlFor={`description-${item.id}`}>
            <textarea
              id={`description-${item.id}`}
              name="description"
              rows={3}
              defaultValue={item.description ?? ""}
              className={textareaClassName}
            />
          </Field>
        </div>

        <div className="flex gap-2 md:col-span-2">
          <button
            type="submit"
            className="h-10 rounded-md border border-ink bg-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-black"
          >
            저장
          </button>
        </div>
      </form>

      <form action={`/api/admin/wishes/${item.id}`} method="post" className="mt-3">
        <input type="hidden" name="_method" value="delete" />
        <button
          type="submit"
          className="h-10 rounded-md border border-[#b91c1c] bg-white px-4 text-sm font-semibold text-[#b91c1c] transition-colors hover:bg-[#fef2f2]"
        >
          삭제
        </button>
      </form>
    </article>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-zinc-700">
        {label}
      </label>
      {children}
    </div>
  );
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

const inputClassName =
  "h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-zinc-400";

const textareaClassName =
  "w-full resize-none rounded-md border border-line bg-white px-3 py-2 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-zinc-400";
