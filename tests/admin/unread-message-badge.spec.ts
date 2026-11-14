// spec: specs/admin-management.md
// seed: tests/admin/seed.spec.ts

import { eq } from "drizzle-orm";
import { messages, wishlists } from "@/src/lib/db/schema";
import { test, expect } from "../fixtures/admin";

test.describe("Message Management", () => {
  test("Unread Message Badge", async ({ page, seedAdmin, signIn, e2eDb }) => {
    // 1. [사전 조건] seedAdmin({ messages: [김친구 생일 축하해!, 이친구 축하해요, 박친구 숨긴 메시지 숨김] }), signIn(admin). `/admin/wishes` 로 이동해 사이드바를 기다립니다(timeout 30초).
    const admin = await seedAdmin({
      messages: [
        { senderName: "김친구", body: "생일 축하해!" },
        { senderName: "이친구", body: "축하해요" },
        { senderName: "박친구", body: "숨긴 메시지", isHidden: true },
      ],
    });
    await signIn(admin);

    const sidebar = page.getByRole("complementary");
    const badge = sidebar.getByLabel("새 메시지 2개");
    const anyBadge = sidebar.getByLabel(/^새 메시지/);

    await page.goto("/admin/wishes");
    await expect(sidebar).toBeVisible({ timeout: 30_000 });

    // expect: 사이드바 배지 `새 메시지 2개`(텍스트 `2`)가 보인다(숨긴 메시지는 세지 않음).
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText("2");

    // 2. `/admin/messages?filter=hidden` 으로 이동해 행 `숨긴 메시지` 를 기다립니다.
    await page.goto("/admin/messages?filter=hidden");
    await expect(
      page.getByRole("article").filter({ hasText: "숨긴 메시지" }),
    ).toBeVisible({ timeout: 30_000 });

    // expect: 배지 `새 메시지 2개` 가 그대로 보인다(숨긴 메시지함은 읽음 처리하지 않음).
    await expect(badge).toBeVisible();

    // 3. [e2eDb 조회, 코드 근거] `wishlists`(`id = admin.wishlistId`)의 `messagesReadAt` 을 조회합니다.
    const loadMessagesReadAt = async () =>
      (
        await e2eDb
          .select()
          .from(wishlists)
          .where(eq(wishlists.id, admin.wishlistId!))
      )[0].messagesReadAt;

    // expect: `null` 이다.
    expect(await loadMessagesReadAt()).toBeNull();

    // 4. 사이드바의 `메시지함` 링크를 눌러 받은 메시지함으로 갑니다.
    await sidebar.getByRole("link", { name: /^메시지함/ }).click();

    // expect: URL 이 `/admin/messages` 이고 행 `생일 축하해!` 가 보인다.
    await expect(page).toHaveURL(/\/admin\/messages$/);
    await expect(
      page.getByRole("article").filter({ hasText: "생일 축하해!" }),
    ).toBeVisible();

    // expect: 배지가 사라진다(`getByLabel(/^새 메시지/)` count 0).
    await expect(anyBadge).toHaveCount(0);

    // 5. [e2eDb 조회, 코드 근거] `messagesReadAt` 을 `expect.poll` 로 조회합니다(`after()` 로 응답 뒤 기록됨).
    // expect: null 이 아니게 된다.
    await expect.poll(loadMessagesReadAt).not.toBeNull();

    // 6. `/admin/wishes` 로 이동합니다.
    await page.goto("/admin/wishes");
    await expect(sidebar).toBeVisible({ timeout: 30_000 });

    // expect: 배지가 없다(서버 집계도 0, 탐색에서 `/admin` 으로 이동해 확인).
    await expect(anyBadge).toHaveCount(0);

    // 7. [e2eDb 변경] 새 메시지를 넣습니다. 그 뒤 페이지를 새로고침합니다.
    await e2eDb.insert(messages).values({
      wishlistId: admin.wishlistId!,
      senderName: "최친구",
      body: "늦었지만 축하해",
      createdAt: new Date(),
    });
    await page.reload();

    // expect: 배지 `새 메시지 1개` 가 보인다.
    await expect(sidebar.getByLabel("새 메시지 1개")).toBeVisible();
  });
});
