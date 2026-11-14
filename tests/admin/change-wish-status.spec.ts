// spec: specs/admin-management.md
// seed: tests/admin/seed.spec.ts

import { eq } from "drizzle-orm";
import { wishItems } from "@/src/lib/db/schema";
import { test, expect } from "../fixtures/admin";

test.describe("Wish Management", () => {
  test("Change Wish Status", async ({ page, seedAdmin, signIn, e2eDb }) => {
    // 1. [사전 조건] `seedAdmin({ items: [무선 이어폰] })`, `signIn(admin)`. `/admin/wishes` 로 이동해 레벨 3 제목 `무선 이어폰` 을 기다립니다.
    const admin = await seedAdmin({
      items: [
        { title: "무선 이어폰", targetAmount: 100_000, fundedAmount: 30_000 },
      ],
    });
    await signIn(admin);

    await page.goto("/admin/wishes");
    await expect(
      page.getByRole("heading", { level: 3, name: "무선 이어폰" }),
    ).toBeVisible({ timeout: 30_000 });

    const card = page.locator("details").filter({
      has: page.getByRole("heading", { level: 3, name: "무선 이어폰" }),
    });
    const tabs = page.getByRole("navigation", { name: "선물 상태 필터" });

    // expect: 카드 배지 `마음 모으는 중`, 탭 `마음 모으는 중 1`·`잠시 멈춤 0` 이다.
    await expect(
      card.locator("summary").getByText("마음 모으는 중", { exact: true }),
    ).toBeVisible();
    await expect(
      tabs.getByRole("link", { name: /^마음 모으는 중 1$/ }),
    ).toBeVisible();
    await expect(tabs.getByRole("link", { name: /^잠시 멈춤 0$/ })).toBeVisible();

    // 2. 카드를 열고 `상태` 에서 `잠시 멈춤` 을 고른 뒤 `저장` 을 누릅니다.
    await card.locator("summary").click();
    await card.getByRole("combobox", { name: "상태" }).selectOption("paused");
    await card.getByRole("button", { name: "저장" }).click();

    // expect: 토스트 `선물을 수정했어요.` 가 보이고 URL 이 `/admin/wishes` 로 정리된다.
    await expect(
      page
        .locator("[data-sonner-toast]")
        .filter({ hasText: "선물을 수정했어요." }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/wishes$/);

    // expect: 카드 배지가 `잠시 멈춤` 이고 summary 금액은 `₩30,000 / ₩100,000` 그대로이다.
    await expect(
      card.locator("summary").getByText("잠시 멈춤", { exact: true }),
    ).toBeVisible();
    await expect(card.locator("summary")).toContainText(/30,000 \/ .*100,000/);

    // expect: 탭이 `마음 모으는 중 0`·`잠시 멈춤 1` 이다.
    await expect(
      tabs.getByRole("link", { name: /^마음 모으는 중 0$/ }),
    ).toBeVisible();
    await expect(tabs.getByRole("link", { name: /^잠시 멈춤 1$/ })).toBeVisible();

    // 3. [e2eDb 조회, 코드 근거] `wish_items`(`id = items[0].id`)를 조회합니다(`expect.poll`).
    const loadWish = async () =>
      (
        await e2eDb
          .select()
          .from(wishItems)
          .where(eq(wishItems.id, admin.items[0].id))
      )[0];
    await expect.poll(async () => (await loadWish()).status).toBe("paused");

    // expect: `status` `paused`, `title` `무선 이어폰`, `targetAmount` `100000`, `fundedAmount` `30000`(상태 변경이 모인 금액을 바꾸지 않음)이다.
    const saved = await loadWish();
    expect(saved.status).toBe("paused");
    expect(saved.title).toBe("무선 이어폰");
    expect(saved.targetAmount).toBe(100000);
    expect(saved.fundedAmount).toBe(30000);
  });
});
