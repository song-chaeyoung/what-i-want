// spec: specs/admin-management.md
// seed: tests/admin/seed.spec.ts

import { eq } from "drizzle-orm";
import { messages, wishItems, wishlists } from "@/src/lib/db/schema";
import { test, expect } from "../fixtures/admin";

test.describe("Cross Account Access", () => {
  test("Cross Account Message Rejected", async ({
    page,
    seedAdmin,
    signIn,
    e2eDb,
  }) => {
    // 1. [사전 조건] 주인 B 와 요청자 A 를 만들고 A 만 로그인합니다. `/admin/messages` 로 이동해 `아직 메시지가 없습니다.` 를 기다립니다.
    const owner = await seedAdmin({
      displayName: "E2E 주인",
      items: [
        { title: "무선 이어폰", targetAmount: 100_000, fundedAmount: 40_000 },
      ],
      messages: [
        {
          senderName: "이친구",
          body: "이어폰에 보태요",
          wishItemIndex: 0,
          amount: 10_000,
        },
        { senderName: "박친구", body: "숨긴 메시지", isHidden: true },
      ],
    });
    const other = await seedAdmin({ displayName: "E2E 다른 사람" });
    await signIn(other);

    await page.goto("/admin/messages");
    await expect(page.getByText("아직 메시지가 없습니다.")).toBeVisible({
      timeout: 30_000,
    });

    // expect: A 의 메시지함에 `이어폰에 보태요` 가 없다.
    await expect(page.getByText("이어폰에 보태요")).toHaveCount(0);

    // 2. B 의 받은 메시지 숨기기를 보냅니다.
    const hideResponse = await page.request.post(
      `/api/admin/messages/${owner.messages[0].id}`,
      { form: { intent: "hide" }, maxRedirects: 0 },
    );

    // expect: 상태 `307`, `location` 이 `/admin/messages?error=1` 이다.
    expect(hideResponse.status()).toBe(307);
    const hideLocation = new URL(hideResponse.headers()["location"]);
    expect(hideLocation.pathname).toBe("/admin/messages");
    expect(hideLocation.search).toBe("?error=1");

    // 3. B 의 숨긴 메시지 해제를 보냅니다.
    const unhideResponse = await page.request.post(
      `/api/admin/messages/${owner.messages[1].id}`,
      { form: { intent: "unhide" }, maxRedirects: 0 },
    );

    // expect: 상태 `307`, `location` 이 `/admin/messages?error=1` 이다.
    expect(unhideResponse.status()).toBe(307);
    const unhideLocation = new URL(unhideResponse.headers()["location"]);
    expect(unhideLocation.pathname).toBe("/admin/messages");
    expect(unhideLocation.search).toBe("?error=1");

    // 4. [e2eDb 조회, 코드 근거] B 의 데이터를 조회합니다.
    const [visibleMessage] = await e2eDb
      .select()
      .from(messages)
      .where(eq(messages.id, owner.messages[0].id));
    const [hiddenMessage] = await e2eDb
      .select()
      .from(messages)
      .where(eq(messages.id, owner.messages[1].id));

    // expect: `owner.messages[0]` 의 `isHidden` 이 `false`, `owner.messages[1]` 의 `isHidden` 이 `true` 그대로이다.
    expect(visibleMessage.isHidden).toBe(false);
    expect(hiddenMessage.isHidden).toBe(true);

    // expect: `wish_items` 의 `fundedAmount` 가 `40000` 그대로이다.
    const [ownerItem] = await e2eDb
      .select()
      .from(wishItems)
      .where(eq(wishItems.id, owner.items[0].id));
    expect(ownerItem.fundedAmount).toBe(40_000);

    // expect: B 의 `wishlists.messagesReadAt` 이 null 그대로이다(A 의 메시지함 방문이 B 의 읽음 기준을 바꾸지 않음).
    const [ownerWishlist] = await e2eDb
      .select()
      .from(wishlists)
      .where(eq(wishlists.id, owner.wishlistId!));
    expect(ownerWishlist.messagesReadAt).toBeNull();
  });
});
