import type { ReactNode } from "react";

export const adminPrimaryButtonClassName =
  "inline-flex h-9 items-center justify-center rounded-md border border-ink bg-ink px-3.5 text-sm font-semibold text-white transition-colors hover:bg-black";

export const adminSecondaryButtonClassName =
  "inline-flex h-9 items-center justify-center rounded-md border border-line bg-white px-3 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-100";

export function AdminMetricGroup({ children }: { children: ReactNode }) {
  return (
    <div className="grid divide-y divide-line overflow-hidden rounded-md border border-line bg-white sm:auto-cols-fr sm:grid-flow-col sm:divide-x sm:divide-y-0">
      {children}
    </div>
  );
}

export function AdminMetric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="min-w-0 px-3.5 py-3">
      <p className="text-xs font-semibold text-zinc-500">{label}</p>
      <p className="mt-1 truncate text-xl font-extrabold text-ink">{value}</p>
      {detail ? (
        <p className="mt-1 text-xs leading-5 text-zinc-500">{detail}</p>
      ) : null}
    </div>
  );
}

export function AdminField({
  label,
  htmlFor,
  required = false,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={htmlFor}
        className="inline-flex items-center gap-1 text-sm font-semibold text-zinc-700"
      >
        {label}
        {required ? (
          <span aria-label="필수" className="text-rose-500">
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint ? <p className="text-xs leading-5 text-zinc-500">{hint}</p> : null}
    </div>
  );
}

export const adminInputClassName =
  "h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-zinc-400";

export const adminTextareaClassName =
  "w-full resize-none rounded-md border border-line bg-white px-3 py-2 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-zinc-400";

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(amount);
}
