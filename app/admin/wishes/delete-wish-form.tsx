"use client";

import { Button } from "@/components/ui/button";

export function DeleteWishForm({
  wishId,
  hasAmount,
}: {
  wishId: string;
  hasAmount: boolean;
}) {
  const confirmMessage = hasAmount
    ? "이 선물을 삭제할까요? 이 선물에 모인 금액 기록도 함께 삭제되고 되돌릴 수 없어요. 받은 메시지는 메시지함에 남아요."
    : "이 선물을 삭제할까요? 삭제하면 되돌릴 수 없어요.";

  return (
    <form
      action={`/api/admin/wishes/${wishId}`}
      method="post"
      className="mt-3"
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="_method" value="delete" />
      <Button type="submit" variant="danger">
        삭제
      </Button>
    </form>
  );
}
