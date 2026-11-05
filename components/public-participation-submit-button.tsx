"use client";

import { useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { rememberAccountRevealTrigger } from "@/src/lib/public-wishlist/account-reveal-focus";

type PublicParticipationSubmitButtonProps = {
  id?: string;
  label: string;
};

export function PublicParticipationSubmitButton({
  id,
  label,
}: PublicParticipationSubmitButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const { pending } = useFormStatus();

  useEffect(() => {
    const button = ref.current;
    const form = button?.form;

    if (!button || !form || !id) {
      return;
    }

    const onSubmit = (event: SubmitEvent) => {
      if (event.submitter === button) {
        rememberAccountRevealTrigger(id);
      }
    };

    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, [id]);

  return (
    <button
      ref={ref}
      id={id}
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="pub-btn pub-btn-accent pub-btn-block h-12 text-sm disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "보내는 중..." : label}
    </button>
  );
}
