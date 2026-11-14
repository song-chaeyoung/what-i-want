// spec: specs/admin-management.md
// seed: tests/admin/seed.spec.ts

import { eq } from "drizzle-orm";
import { wishItems } from "@/src/lib/db/schema";
import { test, expect } from "../fixtures/admin";

test.describe("Wish Management", () => {
  test("Edit Wish", async ({ page, seedAdmin, signIn, e2eDb }) => {
    // 1. [사전 조건] `seedAdmin({ items: [캠핑 의자 paused, 무선 이어폰] })`, `signIn(admin)`. `/admin/wishes` 로 이동해 레벨 3 제목 `캠핑 의자` 를 기다립니다.
    const admin = await seedAdmin({
      items: [
        { title: "캠핑 의자", targetAmount: 80_000, status: "paused" },
        { title: "무선 이어폰", targetAmount: 100_000, fundedAmount: 30_000 },
      ],
    });
    await signIn(admin);

    await page.goto("/admin/wishes");
    await expect(
      page.getByRole("heading", { level: 3, name: "캠핑 의자" }),
    ).toBeVisible({ timeout: 30_000 });

    const chairCard = page.locator("details").filter({
      has: page.getByRole("heading", { level: 3, name: "캠핑 의자" }),
    });

    // 2. `캠핑 의자` 카드의 summary 를 눌러 엽니다.
    await chairCard.locator("summary").click();

    // expect: 카드 `details` 가 열리고 `선물 이름` `캠핑 의자`, `상태` 값 `paused`, `목표 금액` `80000`, `메모` 빈 값이 보인다.
    await expect(chairCard).toHaveJSProperty("open", true);
    await expect(chairCard.getByRole("textbox", { name: "선물 이름" })).toHaveValue(
      "캠핑 의자",
    );
    await expect(chairCard.getByRole("combobox", { name: "상태" })).toHaveValue(
      "paused",
    );
    await expect(
      chairCard.getByRole("spinbutton", { name: "목표 금액" }),
    ).toHaveValue("80000");
    await expect(chairCard.getByRole("textbox", { name: "메모" })).toHaveValue("");

    // 3. `선물 이름` 을 `캠핑 의자 2인용`, `목표 금액` 을 `90000`, `메모` 를 `등받이 있는 걸로` 로 바꾸고(상태는 그대로) 버튼 `저장` 을 누릅니다.
    await chairCard
      .getByRole("textbox", { name: "선물 이름" })
      .fill("캠핑 의자 2인용");
    await chairCard.getByRole("spinbutton", { name: "목표 금액" }).fill("90000");
    await chairCard.getByRole("textbox", { name: "메모" }).fill("등받이 있는 걸로");
    await chairCard.getByRole("button", { name: "저장" }).click();

    // expect: 토스트 `선물을 수정했어요.`(`data-type` `success`)가 보인다.
    const toast = page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "선물을 수정했어요." });
    await expect(toast).toBeVisible();
    await expect(toast).toHaveAttribute("data-type", "success");

    // expect: URL 이 `/admin/wishes` 로 정리된다.
    await expect(page).toHaveURL(/\/admin\/wishes$/);

    // expect: 레벨 3 제목 `캠핑 의자 2인용` 카드 summary 에 배지 `잠시 멈춤` 과 `₩0 / ₩90,000` 이 보이고, 제목 `캠핑 의자`(exact) 카드는 없다.
    const renamedCard = page.locator("details").filter({
      has: page.getByRole("heading", { level: 3, name: "캠핑 의자 2인용" }),
    });
    await expect(
      renamedCard.locator("summary").getByText("잠시 멈춤", { exact: true }),
    ).toBeVisible();
    await expect(renamedCard.locator("summary")).toContainText(/0 \/ .*90,000/);
    await expect(
      page.getByRole("heading", { level: 3, name: "캠핑 의자", exact: true }),
    ).toHaveCount(0);

    // expect: 다른 카드 `무선 이어폰` 은 `₩30,000 / ₩100,000` 그대로이다.
    const earphoneCard = page.locator("details").filter({
      has: page.getByRole("heading", { level: 3, name: "무선 이어폰" }),
    });
    await expect(earphoneCard.locator("summary")).toContainText(
      /30,000 \/ .*100,000/,
    );

    // 4. [e2eDb 조회, 코드 근거] `wish_items`(`id = items[0].id`)를 조회합니다(`expect.poll`).
    const loadWish = async (id: string) =>
      (await e2eDb.select().from(wishItems).where(eq(wishItems.id, id)))[0];
    await expect
      .poll(async () => (await loadWish(admin.items[0].id)).title)
      .toBe("캠핑 의자 2인용");

    // expect: `title` `캠핑 의자 2인용`, `targetAmount` `90000`, `description` `등받이 있는 걸로`, `status` `paused`, `fundedAmount` `0` 이다.
    const chair = await loadWish(admin.items[0].id);
    expect(chair.title).toBe("캠핑 의자 2인용");
    expect(chair.targetAmount).toBe(90000);
    expect(chair.description).toBe("등받이 있는 걸로");
    expect(chair.status).toBe("paused");
    expect(chair.fundedAmount).toBe(0);

    // expect: `items[1]`(무선 이어폰)은 `title`·`targetAmount`·`fundedAmount` 가 그대로이다.
    const earphone = await loadWish(admin.items[1].id);
    expect(earphone.title).toBe("무선 이어폰");
    expect(earphone.targetAmount).toBe(100000);
    expect(earphone.fundedAmount).toBe(30000);
  });
});
