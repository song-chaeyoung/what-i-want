"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function OnboardingSubmitButton() {
  const { pending: actionPending } = useFormStatus();
  const [nativePending, setNativePending] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const pending = actionPending || nativePending;

  useEffect(() => {
    const button = ref.current;
    const form = button?.form;

    if (!button || !form) {
      return;
    }

    let locked = false;

    // 14세 확인은 폼에 나중에 붙을 수 있다. window 버블은 그 다음이라 defaultPrevented를 본다.
    const onSubmit = (event: SubmitEvent) => {
      if (event.target !== form) {
        return;
      }

      if (event.defaultPrevented) {
        return;
      }

      if (locked) {
        event.preventDefault();
        return;
      }

      locked = true;
      // 제출 이벤트 안에서 바로 disabled로 바꾸면 브라우저가 첫 제출을 취소할 수 있다.
      window.setTimeout(() => setNativePending(true), 0);
    };

    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) {
        return;
      }

      locked = false;
      setNativePending(false);
    };

    window.addEventListener("submit", onSubmit);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      window.removeEventListener("submit", onSubmit);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  return (
    <Button
      ref={ref}
      type="submit"
      variant="cta"
      disabled={pending}
      aria-disabled={pending}
      className="h-12 w-full px-4 py-0 disabled:opacity-100"
    >
      {pending ? "만드는 중…" : "위시리스트 만들기"}
    </Button>
  );
}
