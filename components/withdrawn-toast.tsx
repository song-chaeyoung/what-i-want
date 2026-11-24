"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { WITHDRAWAL_COPY } from "@/src/lib/design/copy";

export function WithdrawnToast() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const handledKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (searchParams.get("withdrawn") !== "1") {
      return;
    }

    const toastKey = `${pathname}?${searchParams.toString()}`;

    if (handledKeyRef.current === toastKey) {
      return;
    }

    handledKeyRef.current = toastKey;
    toast.success(WITHDRAWAL_COPY.success);

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("withdrawn");
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  }, [pathname, router, searchParams]);

  return null;
}
