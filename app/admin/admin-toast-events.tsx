"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const adminToastParams = {
  saved: { type: "success", message: "설정을 저장했어요." },
  created: { type: "success", message: "선물을 추가했어요." },
  updated: { type: "success", message: "선물을 수정했어요." },
  deleted: { type: "success", message: "선물을 삭제했어요." },
  error: { type: "error", message: "요청을 처리하지 못했어요." },
} as const;

type AdminToastParam = keyof typeof adminToastParams;

export function AdminToastEvents() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lastToastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const paramName = getAdminToastParam(searchParams);

    if (!paramName) {
      return;
    }

    const toastKey = `${pathname}?${searchParams.toString()}`;

    if (lastToastKeyRef.current === toastKey) {
      return;
    }

    lastToastKeyRef.current = toastKey;

    const toastConfig = adminToastParams[paramName];
    toast[toastConfig.type](toastConfig.message);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete(paramName);

    const nextQuery = nextParams.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [pathname, router, searchParams]);

  return null;
}

function getAdminToastParam(
  searchParams: URLSearchParams,
): AdminToastParam | null {
  for (const paramName of Object.keys(adminToastParams) as AdminToastParam[]) {
    if (searchParams.has(paramName)) {
      return paramName;
    }
  }

  return null;
}
