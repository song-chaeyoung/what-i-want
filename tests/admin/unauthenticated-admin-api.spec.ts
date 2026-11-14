// spec: specs/admin-management.md
// seed: tests/admin/seed.spec.ts

import { eq } from "drizzle-orm";
import { messages, wishItems } from "@/src/lib/db/schema";
import { test, expect } from "../fixtures/admin";

test.describe("Admin Login Boundary", () => {
  test("Unauthenticated Admin API Rejected", async ({
    page,
    seedAdmin,
    e2eDb,
  }) => {
    // 1. [사전 조건] 데이터 주인 B 를 만듭니다. `signIn` 은 호출하지 않습니다.
    const owner = await seedAdmin({
      displayName: "E2E 주인",
      items: [{ title: "캠핑 의자", targetAmount: 80_000 }],
      messages: [{ senderName: "김친구", body: "생일 축하해!" }],
    });

    // expect: `items` 1개와 `messages` 1개가 반환된다.
    expect(owner.items).toHaveLength(1);
    expect(owner.messages).toHaveLength(1);

    // 2. 로그인 없이 `page.request.post('/api/admin/wishes', { form, maxRedirects: 0 })` 를 보냅니다.
    const createResponse = await page.request.post("/api/admin/wishes", {
      form: { title: "익명 선물", targetAmount: "1000" },
      maxRedirects: 0,
    });

    // expect: 상태 `307`, `location` pathname 이 `/login` 이다.
    expect(createResponse.status()).toBe(307);
    expect(new URL(createResponse.headers()["location"]).pathname).toBe(
      "/login",
    );

    // 3. JSON 으로 `page.request.post('/api/admin/wishes', { data })` 를 보냅니다.
    const jsonResponse = await page.request.post("/api/admin/wishes", {
      data: { title: "익명 선물", targetAmount: 1000 },
    });

    // expect: 상태 `401`, 본문이 `{ error: "unauthorized" }` 이다.
    expect(jsonResponse.status()).toBe(401);
    expect(await jsonResponse.json()).toEqual({ error: "unauthorized" });

    // 4. B 의 선물 id 로 patch·delete form 을 보냅니다.
    const patchResponse = await page.request.post(
      `/api/admin/wishes/${owner.items[0].id}`,
      {
        form: {
          _method: "patch",
          title: "바뀐 이름",
          targetAmount: "1",
          status: "hidden",
        },
        maxRedirects: 0,
      },
    );
    const deleteResponse = await page.request.post(
      `/api/admin/wishes/${owner.items[0].id}`,
      { form: { _method: "delete" }, maxRedirects: 0 },
    );

    // expect: 둘 다 상태 `307`, `location` pathname 이 `/login` 이다.
    expect(patchResponse.status()).toBe(307);
    expect(new URL(patchResponse.headers()["location"]).pathname).toBe(
      "/login",
    );
    expect(deleteResponse.status()).toBe(307);
    expect(new URL(deleteResponse.headers()["location"]).pathname).toBe(
      "/login",
    );

    // 5. B 의 메시지 id 로 `intent: "hide"` 를 보냅니다.
    const hideResponse = await page.request.post(
      `/api/admin/messages/${owner.messages[0].id}`,
      { form: { intent: "hide" }, maxRedirects: 0 },
    );

    // expect: 상태 `307`, `location` pathname 이 `/login` 이다.
    expect(hideResponse.status()).toBe(307);
    expect(new URL(hideResponse.headers()["location"]).pathname).toBe(
      "/login",
    );

    // 6. [e2eDb 조회, 코드 근거] B 의 데이터를 조회합니다.
    const savedItems = await e2eDb
      .select()
      .from(wishItems)
      .where(eq(wishItems.wishlistId, owner.wishlistId!));

    // expect: `wish_items` 가 1행이고 `title` `캠핑 의자`, `targetAmount` `80000`, `status` `open` 그대로이다(`익명 선물` 행 없음).
    expect(savedItems).toHaveLength(1);
    expect(savedItems[0].title).toBe("캠핑 의자");
    expect(savedItems[0].targetAmount).toBe(80_000);
    expect(savedItems[0].status).toBe("open");

    // expect: `messages` 의 `isHidden` 이 `false` 이다.
    const [savedMessage] = await e2eDb
      .select()
      .from(messages)
      .where(eq(messages.id, owner.messages[0].id));
    expect(savedMessage.isHidden).toBe(false);
  });
});
