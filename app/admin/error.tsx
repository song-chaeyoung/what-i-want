"use client";

import { useEffect } from "react";
import { adminSecondaryButtonClassName } from "./admin-ui";

export default function AdminError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="grid min-h-[50vh] place-items-center">
      <div className="w-full max-w-md rounded-md border border-line bg-white px-5 py-6 text-center">
        <p className="text-xs font-semibold text-zinc-500">오류</p>
        <h2 className="mt-2 text-lg font-extrabold text-ink">
          데이터를 불러오지 못했어요
        </h2>
        <p className="mt-2 text-sm font-semibold text-zinc-500">
          일시적인 오류예요. 잠시 후 다시 시도해주세요.
        </p>
        <button
          type="button"
          onClick={() => unstable_retry()}
          className={`${adminSecondaryButtonClassName} mt-4`}
        >
          다시 시도
        </button>
      </div>
    </section>
  );
}
