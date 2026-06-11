"use client";

import { useFormStatus } from "react-dom";

type PublicParticipationSubmitButtonProps = {
  label: string;
};

export function PublicParticipationSubmitButton({
  label,
}: PublicParticipationSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className="pub-btn pub-btn-accent pub-btn-block h-12 text-sm disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "보내는 중..." : label}
    </button>
  );
}
