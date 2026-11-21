// spec: specs/admin-management-2.md
// seed: tests/admin/seed-settings.spec.ts

import { eq, inArray } from "drizzle-orm";
import {
  bankAccounts,
  fundingLogs,
  messages,
  profiles,
  wishItems,
  wishlists,
} from "@/src/lib/db/schema";
import { test, expect } from "../fixtures/admin";

const WON = "₩";

test.describe("Wishlist Reset", () => {
  test("Reset Wishlist", async ({ page, seedAdmin, signIn, e2eDb }) => {
    // 1. [사전 조건] 선물 2개·메시지 3개·계좌로 seedAdmin 하고 signIn 한 뒤 e2eDb 로 초기화 전 값을 보관합니다.
    const admin = await seedAdmin({
      displayName: "E2E 관리자",
      items: [
        { title: "무선 이어폰", targetAmount: 100_000, fundedAmount: 30_000 },
        { title: "숨긴 선물", targetAmount: 10_000, status: "hidden" },
      ],
      messages: [
        { senderName: "김친구", body: "생일 축하해!" },
        {
          senderName: "이친구",
          body: "이어폰에 보태요",
          wishItemIndex: 0,
          amount: 30_000,
        },
        { senderName: "박친구", body: "숨긴 메시지", isHidden: true },
      ],
      bankAccount: {
        bankName: "E2E은행",
        accountHolder: "E2E 관리자",
        accountNumber: "123-456-789012",
        visibility: "copy_only",
      },
    });
    const wishlistId = admin.wishlistId as string;
    const slug = admin.slug as string;
    await signIn(admin);

    const loadWishlist = async () =>
      (
        await e2eDb
          .select()
          .from(wishlists)
          .where(eq(wishlists.id, wishlistId))
      )[0];
    const loadProfile = async () =>
      (
        await e2eDb
          .select()
          .from(profiles)
          .where(eq(profiles.userId, admin.userId))
      )[0];
    const loadAccounts = async () =>
      e2eDb
        .select()
        .from(bankAccounts)
        .where(eq(bankAccounts.userId, admin.userId));
    const loadItems = async () =>
      e2eDb
        .select()
        .from(wishItems)
        .where(eq(wishItems.wishlistId, wishlistId));
    const loadMessages = async () =>
      e2eDb
        .select()
        .from(messages)
        .where(eq(messages.wishlistId, wishlistId));

    const wishlistBefore = await loadWishlist();
    const profileBefore = await loadProfile();
    const accountBefore = (await loadAccounts())[0];

    // expect: `wish_items` 2행, `messages` 3행이 있다.
    expect(await loadItems()).toHaveLength(2);
    expect(await loadMessages()).toHaveLength(3);

    // 공개 페이지는 unstable_cache 로 캐시되므로, 초기화 전에 한 번 열어 6단계가 캐시 무효화까지 확인하게 한다(숨긴 선물은 공개 페이지에 없음).
    await page.goto(`/wishlist/${slug}`);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "E2E 관리자님의 위시리스트",
      }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.locator("dt", { hasText: /^선물$/ }).locator("xpath=following-sibling::dd[1]"),
    ).toHaveText("1개");

    // 2. `/admin/messages` 를 한 번 방문한 뒤 `messagesReadAt` 이 기록되길 기다립니다(응답 뒤 `after()` 로 기록됨).
    await page.goto("/admin/messages");
    await expect(page.getByText("이친구", { exact: true }).first()).toBeVisible({
      timeout: 30_000,
    });

    // expect: `messagesReadAt` 이 null 이 아니다.
    await expect
      .poll(async () => (await loadWishlist()).messagesReadAt, {
        timeout: 15_000,
      })
      .not.toBeNull();

    // 3. `/admin/settings` 에서 확인 창을 수락하고 `위시리스트 초기화` 를 누릅니다.
    await page.goto("/admin/settings");
    const resetButton = page.getByRole("button", { name: "위시리스트 초기화" });
    await expect(resetButton).toBeVisible({ timeout: 30_000 });

    page.once("dialog", async (dialog) => {
      await dialog.accept();
    });
    await resetButton.click();

    // expect: 토스트 `위시리스트를 초기화했어요. 새 생일을 준비해 보세요.`(success)가 보인다.
    const toast = page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "위시리스트를 초기화했어요. 새 생일을 준비해 보세요." });
    await expect(toast).toBeVisible({ timeout: 15_000 });
    await expect(toast).toHaveAttribute("data-type", "success");

    // expect: URL 이 `/admin/settings` 로 정리된다.
    await expect(page).toHaveURL(/\/admin\/settings$/, { timeout: 15_000 });

    // expect: 다시 렌더된 프로필·공개 페이지·계좌 값이 초기화 전과 같다(서버 렌더).
    await expect(page.locator("#displayName")).toHaveValue("E2E 관리자");
    await expect(page.locator("#wishlistSlug")).toHaveValue(slug);
    await expect(page.locator("#wishlistTitle")).toHaveValue(
      "E2E 관리자님의 위시리스트",
    );
    await expect(page.locator("#themeId")).toHaveValue("pixel_y2k");
    await expect(page.locator("#bankName")).toHaveValue("E2E은행");
    await expect(page.locator("#accountHolder")).toHaveValue("E2E 관리자");
    await expect(page.locator("#accountVisibility")).toHaveValue("copy_only");

    // 4. [e2eDb 조회, 코드 근거] 초기화 결과를 조회합니다.
    // expect: 선물·메시지(숨긴 메시지 포함)·후원 기록이 0행이다.
    await expect.poll(async () => (await loadItems()).length, {
      timeout: 15_000,
    }).toBe(0);
    expect(await loadMessages()).toHaveLength(0);
    expect(
      await e2eDb
        .select()
        .from(fundingLogs)
        .where(
          inArray(
            fundingLogs.wishItemId,
            admin.items.map((item) => item.id),
          ),
        ),
    ).toHaveLength(0);

    // expect: `messagesReadAt` 이 null 이고 `slug`·`title`·`themeId`·`visibility` 가 초기화 전과 같다.
    const wishlistAfter = await loadWishlist();
    expect(wishlistAfter.messagesReadAt).toBeNull();
    expect(wishlistAfter.slug).toBe(wishlistBefore.slug);
    expect(wishlistAfter.title).toBe(wishlistBefore.title);
    expect(wishlistAfter.themeId).toBe(wishlistBefore.themeId);
    expect(wishlistAfter.visibility).toBe(wishlistBefore.visibility);

    // expect: `profiles.displayName` 이 초기화 전 값과 같다.
    expect((await loadProfile()).displayName).toBe(profileBefore.displayName);

    // expect: `bank_accounts` 1행이 그대로이다.
    const accountsAfter = await loadAccounts();
    expect(accountsAfter).toHaveLength(1);
    expect(accountsAfter[0].bankName).toBe(accountBefore.bankName);
    expect(accountsAfter[0].visibility).toBe(accountBefore.visibility);
    expect(accountsAfter[0].accountNumberEncrypted).toBe(
      accountBefore.accountNumberEncrypted,
    );

    // 5. `/admin` 으로 이동해 `내 공개 주소` 를 기다립니다.
    await page.goto("/admin");
    await expect(page.getByText("내 공개 주소", { exact: true })).toBeVisible({
      timeout: 30_000,
    });

    // expect: 지표 `선물` `0개`, `메시지` `0개`, `모인 금액` `₩0` 이다.
    const main = page.getByRole("main");
    const metric = (label: string) =>
      main.getByText(label, { exact: true }).locator("xpath=..");
    await expect(metric("선물").locator("p").nth(1)).toHaveText("0개");
    await expect(metric("메시지").locator("p").nth(1)).toHaveText("0개");
    await expect(metric("모인 금액").locator("p").nth(1)).toHaveText(`${WON}0`);

    // expect: 빈 상태 문구가 보인다.
    await expect(main.getByText("등록된 선물이 없습니다.")).toBeVisible();
    await expect(main.getByText("아직 메시지가 없습니다.")).toBeVisible();

    // expect: `내 공개 주소` 가 여전히 `/wishlist/${admin.slug}` 이다.
    await expect(
      main.getByText(`/wishlist/${slug}`, { exact: true }),
    ).toBeVisible();

    // 6. `/wishlist/${admin.slug}` 로 이동해 레벨 1 제목을 기다립니다.
    await page.goto(`/wishlist/${slug}`);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "E2E 관리자님의 위시리스트",
      }),
    ).toBeVisible({ timeout: 30_000 });

    // expect: `선물` `0개`, `모인 마음` `₩0` 이다.
    await expect(
      page.locator("dt", { hasText: /^선물$/ }).locator("xpath=following-sibling::dd[1]"),
    ).toHaveText("0개");
    await expect(
      page
        .locator("dt", { hasText: /^모인 마음$/ })
        .locator("xpath=following-sibling::dd[1]"),
    ).toHaveText(`${WON}0`);

    // expect: `article` 이 0개이고 `아직 공개된 선물이 없어요` 가 보인다.
    await expect(page.locator("article")).toHaveCount(0);
    await expect(page.getByText("아직 공개된 선물이 없어요")).toBeVisible();

    // expect: `계좌 안내` details 가 그대로 있다(계좌는 초기화 대상이 아님).
    await expect(
      page.locator("details").filter({ hasText: "gift account" }),
    ).toHaveCount(1);
  });
});
