"use client";

import { Button } from "@/components/ui/button";

const confirmMessage =
  "위시리스트를 초기화할까요? 등록한 선물, 받은 메시지, 모인 금액 기록이 모두 삭제되고 되돌릴 수 없어요. 프로필, 공개 주소, 테마, 계좌 안내는 유지돼요.";

export function ResetWishlistForm() {
  return (
    <form
      action="/api/admin/wishlist/reset"
      method="post"
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      <Button type="submit" variant="danger">
        위시리스트 초기화
      </Button>
    </form>
  );
}
