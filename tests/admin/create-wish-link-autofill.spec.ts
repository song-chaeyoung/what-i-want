// spec: specs/admin-management.md
// seed: tests/admin/seed.spec.ts

import { eq } from "drizzle-orm";
import { wishItems } from "@/src/lib/db/schema";
import { test, expect } from "../fixtures/admin";

test.describe("Wish Management", () => {
  test("Create Wish With Link Autofill", async ({
    page,
    seedAdmin,
    signIn,
    e2eDb,
  }) => {
    // 1. [사전 조건] `seedAdmin()`, `signIn(admin)`. link-preview 요청을 가짜 응답으로 막고 `/admin/wishes` 로 이동해 `등록된 선물이 없습니다.` 를 기다립니다.
    const admin = await seedAdmin();
    await signIn(admin);

    const previewRequests: string[] = [];
    await page.route("**/api/admin/wishes/link-preview**", (route) => {
      previewRequests.push(route.request().url());
      return route.fulfill({
        json: {
          preview: {
            title: "가짜 상품",
            imageUrl: "https://example.com/fake.png",
            price: 39000,
          },
        },
      });
    });

    await page.goto("/admin/wishes");
    await expect(page.getByText("등록된 선물이 없습니다.")).toBeVisible({
      timeout: 30_000,
    });

    const createPanel = page.locator("details#create-wish");
    const titleInput = createPanel.getByLabel("선물 이름");
    const amountInput = createPanel.getByLabel("목표 금액");
    const productUrlInput = createPanel.getByLabel("상품 링크");
    const imageUrlInput = createPanel.getByLabel("이미지 링크");
    const autofillButton = createPanel.getByRole("button", {
      name: "정보 불러오기",
    });

    // 2. `상품 링크` 가 빈 채로 버튼 `정보 불러오기` 를 누릅니다.
    await autofillButton.click();

    // expect: 토스트 `상품 링크를 먼저 입력해 주세요.`(`data-type` `error`)가 보인다.
    const emptyLinkToast = page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "상품 링크를 먼저 입력해 주세요." });
    await expect(emptyLinkToast).toBeVisible();
    await expect(emptyLinkToast).toHaveAttribute("data-type", "error");

    // expect: link-preview 요청이 나가지 않는다(route 핸들러 호출 횟수 0).
    expect(previewRequests).toHaveLength(0);

    // 3. `선물 이름` 에 `내가 정한 이름` 을 먼저 입력하고, `상품 링크` 에 `https://shop.example.com/item/1` 을 입력한 뒤 `정보 불러오기` 를 누릅니다.
    await titleInput.fill("내가 정한 이름");
    await productUrlInput.fill("https://shop.example.com/item/1");
    await autofillButton.click();

    // expect: 토스트 `상품 정보를 채웠어요. 저장 전에 확인해 주세요.`(`data-type` `success`)가 보인다.
    const filledToast = page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "상품 정보를 채웠어요. 저장 전에 확인해 주세요." });
    await expect(filledToast).toBeVisible();
    await expect(filledToast).toHaveAttribute("data-type", "success");

    // expect: 요청 URL 의 `url` 쿼리가 `https://shop.example.com/item/1` 이다.
    expect(previewRequests).toHaveLength(1);
    expect(new URL(previewRequests[0]).searchParams.get("url")).toBe(
      "https://shop.example.com/item/1",
    );

    // expect: `선물 이름` 은 `내가 정한 이름` 그대로이고(빈 칸만 채움), `목표 금액` 이 `39000`, `이미지 링크` 가 `https://example.com/fake.png` 로 채워진다.
    await expect(titleInput).toHaveValue("내가 정한 이름");
    await expect(amountInput).toHaveValue("39000");
    await expect(imageUrlInput).toHaveValue("https://example.com/fake.png");

    // 4. 버튼 `추가하기` 를 누릅니다.
    await createPanel.getByRole("button", { name: "추가하기" }).click();

    // expect: 토스트 `선물을 추가했어요.` 가 보이고 레벨 3 제목 `내가 정한 이름` 카드에 `₩0 / ₩39,000` 이 보인다.
    await expect(
      page
        .locator("[data-sonner-toast]")
        .filter({ hasText: "선물을 추가했어요." }),
    ).toBeVisible();
    const card = page.locator("details").filter({
      has: page.getByRole("heading", { level: 3, name: "내가 정한 이름" }),
    });
    await expect(card.locator("summary")).toContainText(/0 \/ .*39,000/);

    // 5. [e2eDb 조회, 코드 근거] `wish_items`(`wishlistId = admin.wishlistId`)를 조회합니다(`expect.poll`).
    const loadWishes = () =>
      e2eDb
        .select()
        .from(wishItems)
        .where(eq(wishItems.wishlistId, admin.wishlistId!));
    await expect.poll(async () => (await loadWishes()).length).toBe(1);

    // expect: 1행이고 `title` `내가 정한 이름`, `targetAmount` `39000`, `productUrl` `https://shop.example.com/item/1`, `imageUrl` `https://example.com/fake.png` 이다.
    const [saved] = await loadWishes();
    expect(saved.title).toBe("내가 정한 이름");
    expect(saved.targetAmount).toBe(39000);
    expect(saved.productUrl).toBe("https://shop.example.com/item/1");
    expect(saved.imageUrl).toBe("https://example.com/fake.png");
  });
});
