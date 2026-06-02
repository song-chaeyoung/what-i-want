import type { ReactNode } from "react";
import Link from "next/link";

type AdminNoticeTone = "error" | "success";

export function AdminNotice({
  children,
  tone = "error",
}: {
  children: ReactNode;
  tone?: AdminNoticeTone;
}) {
  const className =
    tone === "success"
      ? "rounded-md border border-teal/30 bg-[#ecfdf5] px-4 py-3 text-sm font-medium text-teal"
      : "rounded-md border border-orange/40 bg-[#fff7ed] px-4 py-3 text-sm font-medium text-[#9a3412]";

  return <p className={className}>{children}</p>;
}

export function AdminOverviewCard({
  header,
  children,
  description,
}: {
  header: ReactNode;
  children?: ReactNode;
  description?: string;
}) {
  return (
    <div className="rounded-md border border-line bg-[#fbfbfa] p-4 sm:p-5">
      <div className="space-y-4">
        <div className="space-y-3">
          {header}
          {description ? (
            <p className="max-w-xl text-sm leading-6 text-zinc-600">
              {description}
            </p>
          ) : null}
        </div>
        {children}
      </div>
    </div>
  );
}

export function AdminPageHeader({
  actionHref,
  actionLabel = "공개 페이지 보기",
  actionVariant = "secondary",
  description,
  eyebrow,
  slug,
  title,
}: {
  actionHref?: string;
  actionLabel?: string;
  actionVariant?: "primary" | "secondary";
  description?: string;
  eyebrow?: string;
  slug?: string;
  title: string;
}) {
  const href = actionHref ?? (slug ? `/b/${slug}` : null);
  const actionClassName =
    actionVariant === "primary"
      ? "inline-flex h-9 self-start items-center justify-center rounded-md border border-ink bg-ink px-3.5 text-sm font-semibold text-white transition-colors hover:bg-black"
      : "inline-flex h-9 self-start items-center justify-center rounded-md border border-line bg-white px-3 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-100";

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-xs font-bold uppercase text-teal">{eyebrow}</p>
        ) : null}
        <h2 className="mt-1 text-lg font-extrabold tracking-normal text-ink">
          {title}
        </h2>
        {description ? (
          <p className="mt-1.5 max-w-xl text-sm leading-6 text-zinc-600">
            {description}
          </p>
        ) : null}
      </div>
      {href ? (
        <Link href={href} className={actionClassName}>
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function AdminMetric({
  label,
  value,
  detail,
  variant = "card",
}: {
  label: string;
  value: string;
  detail?: string;
  variant?: "card" | "inline";
}) {
  if (variant === "inline") {
    return (
      <div className="min-w-0">
        <p className="text-xs font-semibold text-zinc-500">{label}</p>
        <p className="mt-1 truncate text-lg font-extrabold text-ink">{value}</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-line bg-white px-3.5 py-3">
      <p className="text-xs font-semibold text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-extrabold text-ink">{value}</p>
      {detail ? (
        <p className="mt-1 text-xs leading-5 text-zinc-500">{detail}</p>
      ) : null}
    </div>
  );
}

export function AdminField({
  label,
  htmlFor,
  badge,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  badge?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label
          htmlFor={htmlFor}
          className="text-sm font-semibold text-zinc-700"
        >
          {label}
        </label>
        {badge ? (
          <span className="rounded-full border border-line bg-[#fafaf9] px-2 py-0.5 text-xs font-semibold text-zinc-500">
            {badge}
          </span>
        ) : null}
      </div>
      {children}
      {hint ? <p className="text-xs leading-5 text-zinc-500">{hint}</p> : null}
    </div>
  );
}

export const adminInputClassName =
  "h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-zinc-400";

export const adminTextareaClassName =
  "w-full resize-none rounded-md border border-line bg-white px-3 py-2 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-zinc-400";
