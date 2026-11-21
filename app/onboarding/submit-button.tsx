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

    const iframe = document.createElement("iframe");
    iframe.name = "onboarding-submit";
    iframe.hidden = true;
    iframe.setAttribute("aria-hidden", "true");
    iframe.tabIndex = -1;
    document.body.appendChild(iframe);

    let locked = false;

    const onFrameLoad = () => {
      let href = "";

      try {
        href = iframe.contentWindow?.location.href ?? "";
      } catch {
        return;
      }

      if (href === "" || href === "about:blank") {
        return;
      }

      window.location.assign(href);
    };

    // 14세 확인 리스너가 폼에서 먼저 돈 뒤에 판단한다.
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
      // 최상위 이동은 버튼을 바로 지운다. 응답은 숨은 프레임이 받고, 그때 이동한다.
      form.target = iframe.name;
      // 제출 이벤트 안에서 바로 disabled로 바꾸면 브라우저가 첫 제출을 취소할 수 있다.
      window.setTimeout(() => setNativePending(true), 0);
    };

    iframe.addEventListener("load", onFrameLoad);
    window.addEventListener("submit", onSubmit);

    return () => {
      window.removeEventListener("submit", onSubmit);
      iframe.removeEventListener("load", onFrameLoad);
      iframe.remove();
      form.target = "";
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
