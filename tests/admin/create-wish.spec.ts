// spec: specs/admin-management.md
// seed: tests/admin/seed.spec.ts

import { eq } from "drizzle-orm";
import { wishItems } from "@/src/lib/db/schema";
import { test, expect } from "../fixtures/admin";

test.describe("Wish Management", () => {
  test("Create Wish", async ({ page, seedAdmin, signIn, e2eDb }) => {
    // 1. [사전 조건] `seedAdmin()`(선물 없음, 계좌 없음), `signIn(admin)`. `/admin/wishes` 로 이동해 `등록된 선물이 없습니다.` 를 기다립니다.
    const admin = await seedAdmin();
    await signIn(admin);

    await page.goto("/admin/wishes");
    await expect(page.getByText("등록된 선물이 없습니다.")).toBeVisible({
      timeout: 30_000,
    });

    // expect: 지표 `총 선물` 이 `0개`, `모인 금액` 이 `₩0` 이다.
    await expect(page.getByText("총 선물", { exact: true })).toBeVisible();
    await expect(page.getByText("0개", { exact: true })).toBeVisible();
    await expect(page.getByText("모인 금액", { exact: true })).toBeVisible();
    await expect(page.getByText("₩0", { exact: true })).toBeVisible();

    // expect: 선물이 없으므로 `details#create-wish` 가 열려 있다.
    const createPanel = page.locator("details#create-wish");
    await expect(createPanel).toHaveJSProperty("open", true);

    // expect: 링크 `선물 추가하기`(href `#create-wish`)가 보인다.
    await expect(
      page.getByRole("link", { name: "선물 추가하기" }),
    ).toHaveAttribute("href", "#create-wish");

    // 2. 추가 패널에서 `선물 이름` `E2E 텀블러`, `목표 금액` `45000`, `메모` `보온 되는 걸로` 를 입력하고 버튼 `추가하기` 를 누릅니다.
    await createPanel.getByLabel("선물 이름").fill("E2E 텀블러");
    await createPanel.getByLabel("목표 금액").fill("45000");
    await createPanel.getByLabel("메모").fill("보온 되는 걸로");
    await createPanel.getByRole("button", { name: "추가하기" }).click();

    // expect: 토스트 `선물을 추가했어요.`(`data-type` `success`)가 보인다.
    const successToast = page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "선물을 추가했어요." });
    await expect(successToast).toBeVisible();
    await expect(successToast).toHaveAttribute("data-type", "success");

    // expect: 토스트 `계좌번호가 등록되어 있지 않아요...`(`data-type` `warning`)와 그 안의 버튼 `계좌 등록` 이 보인다(클릭하지 않음).
    const warningToast = page.locator("[data-sonner-toast]").filter({
      hasText: "계좌번호가 등록되어 있지 않아요. 설정에서 계좌번호를 추가해 주세요.",
    });
    await expect(warningToast).toBeVisible();
    await expect(warningToast).toHaveAttribute("data-type", "warning");
    await expect(
      warningToast.getByRole("button", { name: "계좌 등록" }),
    ).toBeVisible();

    // expect: URL 이 `/admin/wishes` 로 정리된다(쿼리 없음).
    await expect(page).toHaveURL(/\/admin\/wishes$/);

    // 3. 목록을 확인합니다.
    // expect: 레벨 3 제목 `E2E 텀블러` 카드가 있고 summary 에 배지 `마음 모으는 중` 과 `₩0 / ₩45,000` 이 보인다.
    const card = page.locator("details").filter({
      has: page.getByRole("heading", { level: 3, name: "E2E 텀블러" }),
    });
    await expect(card).toHaveCount(1);
    await expect(
      card.locator("summary").getByText("마음 모으는 중", { exact: true }),
    ).toBeVisible();
    await expect(card.locator("summary")).toContainText(/0 \/ .*45,000/);

    // expect: 지표 `총 선물` 이 `1개`, 탭 `전체 1`·`마음 모으는 중 1` 이다.
    await expect(page.getByText("1개", { exact: true })).toBeVisible();
    const tabs = page.getByRole("navigation", { name: "선물 상태 필터" });
    await expect(tabs.getByRole("link", { name: /^전체 1$/ })).toBeVisible();
    await expect(
      tabs.getByRole("link", { name: /^마음 모으는 중 1$/ }),
    ).toBeVisible();

    // expect: `등록된 선물이 없습니다.` 가 사라진다.
    await expect(page.getByText("등록된 선물이 없습니다.")).toHaveCount(0);

    // 4. [e2eDb 조회, 코드 근거] `wish_items`(`wishlistId = admin.wishlistId`)를 조회합니다(`expect.poll`).
    const loadWishes = () =>
      e2eDb
        .select()
        .from(wishItems)
        .where(eq(wishItems.wishlistId, admin.wishlistId!));
    await expect.poll(async () => (await loadWishes()).length).toBe(1);

    // expect: 1행이고 `title` `E2E 텀블러`, `targetAmount` `45000`, `fundedAmount` `0`, `status` `open`, `description` `보온 되는 걸로`, `productUrl`·`imageUrl` 이 null 이다.
    const [saved] = await loadWishes();
    expect(saved.title).toBe("E2E 텀블러");
    expect(saved.targetAmount).toBe(45000);
    expect(saved.fundedAmount).toBe(0);
    expect(saved.status).toBe("open");
    expect(saved.description).toBe("보온 되는 걸로");
    expect(saved.productUrl).toBeNull();
    expect(saved.imageUrl).toBeNull();
  });
});
