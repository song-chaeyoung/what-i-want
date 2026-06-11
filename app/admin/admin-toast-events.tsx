"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast, type ExternalToast } from "sonner";

const adminToastParams = {
  saved: { type: "success", message: "설정을 저장했어요." },
  created: { type: "success", message: "선물을 추가했어요." },
  missingAccount: {
    type: "warning",
    message: "계좌번호가 등록되어 있지 않아요. 설정에서 계좌번호를 추가해 주세요.",
    action: { label: "계좌 등록", href: "/admin/settings#account-settings" },
  },
  updated: { type: "success", message: "선물을 수정했어요." },
  deleted: { type: "success", message: "선물을 삭제했어요." },
  error: { type: "error", message: "요청을 처리하지 못했어요." },
} as const;

type AdminToastParam = keyof typeof adminToastParams;
type AdminToastConfig = (typeof adminToastParams)[AdminToastParam];

export function AdminToastEvents() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const lastToastKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const toastParamNames = getAdminToastParams(searchParams);

    if (toastParamNames.length === 0) {
      return;
    }

    const toastKey = `${pathname}?${searchParams.toString()}`;

    if (lastToastKeyRef.current === toastKey) {
      return;
    }

    lastToastKeyRef.current = toastKey;

    const toastConfigList = toastParamNames.map(
      (paramName) => adminToastParams[paramName],
    );
    toastConfigList.forEach((toastConfig) => {
      toast[toastConfig.type](
        toastConfig.message,
        getAdminToastOptions(toastConfig, router),
      );
    });

    const nextParams = new URLSearchParams(searchParams.toString());
    toastParamNames.forEach((paramName) => {
      nextParams.delete(paramName);
    });

    const nextQuery = nextParams.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [pathname, router, searchParams]);

  return null;
}

function getAdminToastParams(
  searchParams: URLSearchParams,
): AdminToastParam[] {
  const paramNames: AdminToastParam[] = [];

  for (const paramName of Object.keys(adminToastParams) as AdminToastParam[]) {
    if (searchParams.has(paramName)) {
      paramNames.push(paramName);
    }
  }

  return paramNames;
}

function getAdminToastOptions(
  toastConfig: AdminToastConfig,
  router: ReturnType<typeof useRouter>,
): ExternalToast | undefined {
  if (!("action" in toastConfig)) {
    return undefined;
  }

  return {
    action: {
      label: toastConfig.action.label,
      onClick: () => router.push(toastConfig.action.href),
    },
  };
}
