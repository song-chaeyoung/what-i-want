"use client";

import { Button } from "@/components/ui/button";

export function HideMessageForm({
  messageId,
  hasAmount,
}: {
  messageId: string;
  hasAmount: boolean;
}) {
  const confirmMessage = hasAmount
    ? "이 참여 기록을 숨길까요? 함께 보낸 마음 금액은 모인 금액에서 빠지고, 숨긴 메시지 목록에서 복구할 수 있어요."
    : "이 메시지를 숨길까요? 숨긴 메시지 목록에서 복구할 수 있어요.";

  return (
    <form
      action={`/api/admin/messages/${messageId}`}
      method="post"
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="intent" value="hide" />
      <Button type="submit" variant="subtle">
        숨기기
      </Button>
    </form>
  );
}
