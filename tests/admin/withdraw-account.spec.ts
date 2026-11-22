// spec: specs/admin-management.md
// seed: tests/admin/seed-settings.spec.ts

import { eq } from "drizzle-orm";
import {
  bankAccounts,
  fundingLogs,
  messages,
  sessions,
  users,
  wishItems,
  wishlists,
} from "@/src/lib/db/schema";
import type { E2EDatabase } from "../support/e2e-db";
import { test, expect } from "../fixtures/admin";

const SESSION_COOKIE = "authjs.session-token";
const CONFIRM_MESSAGE =
  "정말 탈퇴할까요? 계정, 위시리스트, 선물, 받은 메시지, 모인 금액 기록, 계좌 정보가 바로 모두 삭제되고 되돌릴 수 없어요. 탈퇴한 뒤에는 다른 사람이 같은 공개 주소를 쓸 수 있어서, 예전에 공유한 링크가 다른 사람의 위시리스트로 열릴 수 있어요.";

test.describe("Withdraw Account", () => {
  test("Withdraw Account", async ({
    page,
    context,
    seedAdmin,
    signIn,
    e2eDb,
  }) => {
    // 1. [사전 조건] 공개 페이지를 먼저 열어 캐시를 채운다.
    const admin = await seedAdmin({
      displayName: "E2E 탈퇴",
      items: [
        { title: "탈퇴 선물", targetAmount: 10_000, fundedAmount: 1_000 },
      ],
      messages: [
        {
          senderName: "친구",
          body: "축하해",
          wishItemIndex: 0,
          amount: 1_000,
        },
      ],
      bankAccount: {
        bankName: "E2E은행",
        accountHolder: "E2E 탈퇴",
        accountNumber: "123-456-789012",
        visibility: "copy_only",
      },
    });
    const other = await seedAdmin({ displayName: "E2E 남는 사람" });
    await signIn(admin);

    await page.goto(`/wishlist/${admin.slug}`);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "E2E 탈퇴님의 위시리스트",
      }),
    ).toBeVisible({ timeout: 30_000 });

    await page.goto("/admin/settings");
    const withdrawButton = page.getByRole("button", { name: "회원 탈퇴" });
    await expect(withdrawButton).toBeVisible({ timeout: 30_000 });

    // 2. 확인 창을 수락하면 로그아웃되고 첫 화면 토스트가 한 번 나온다.
    let dialogMessage = "";
    page.once("dialog", (dialog) => {
      dialogMessage = dialog.message();
      return dialog.accept();
    });
    await withdrawButton.click();

    const withdrawnToast = page.locator("[data-sonner-toast]").filter({
      hasText: "탈퇴가 끝났어요. 그동안 이용해 주셔서 고마워요.",
    });
    await expect(withdrawnToast).toBeVisible({ timeout: 15_000 });
    await expect(withdrawnToast).toHaveAttribute("data-type", "success");
    expect(dialogMessage).toBe(CONFIRM_MESSAGE);
    await expect(page).toHaveURL("http://localhost:3200/", { timeout: 15_000 });
    await expect(withdrawnToast).toHaveCount(1);

    await page.reload();
    await expect(
      page.getByRole("heading", { level: 1, name: "친구들과 함께하는 생일 선물 펀딩" }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);
    await expect(page).toHaveURL("http://localhost:3200/");

    const cookiesAfter = await context.cookies();
    expect(
      cookiesAfter.find((cookie) => cookie.name === SESSION_COOKIE),
    ).toBeUndefined();

    await expect
      .poll(async () =>
        countOwnedRows(e2eDb, {
          userId: admin.userId,
          wishlistId: admin.wishlistId ?? "",
          wishItemId: admin.items[0]?.id ?? "",
        }),
      )
      .toEqual({
        users: 0,
        sessions: 0,
        wishlists: 0,
        wishItems: 0,
        messages: 0,
        fundingLogs: 0,
        bankAccounts: 0,
      });
    const [otherUser] = await e2eDb
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, other.userId));
    expect(otherUser?.id).toBe(other.userId);

    // 3. 관리 화면은 로그인으로 돌아가고, 공개 링크는 없다.
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login$/, { timeout: 30_000 });
    await expect(
      page.getByRole("button", { name: "Google로 계속하기" }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("complementary")).toHaveCount(0);

    await page.goto(`/wishlist/${admin.slug}`);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "위시리스트를 찾을 수 없어요",
      }),
    ).toBeVisible({ timeout: 30_000 });

    const ogImage = await page.request.get(
      `/wishlist/${admin.slug}/opengraph-image`,
    );
    expect(ogImage.status()).toBe(200);
    expect(ogImage.headers()["content-type"] ?? "").toContain("image/png");
  });
});

async function countOwnedRows(
  e2eDb: E2EDatabase,
  ids: { userId: string; wishlistId: string; wishItemId: string },
) {
  const [
    userRows,
    sessionRows,
    wishlistRows,
    wishItemRows,
    messageRows,
    fundingRows,
    bankRows,
  ] = await Promise.all([
    e2eDb.select({ id: users.id }).from(users).where(eq(users.id, ids.userId)),
    e2eDb
      .select({ userId: sessions.userId })
      .from(sessions)
      .where(eq(sessions.userId, ids.userId)),
    e2eDb
      .select({ id: wishlists.id })
      .from(wishlists)
      .where(eq(wishlists.ownerId, ids.userId)),
    e2eDb
      .select({ id: wishItems.id })
      .from(wishItems)
      .where(eq(wishItems.wishlistId, ids.wishlistId)),
    e2eDb
      .select({ id: messages.id })
      .from(messages)
      .where(eq(messages.wishlistId, ids.wishlistId)),
    e2eDb
      .select({ id: fundingLogs.id })
      .from(fundingLogs)
      .where(eq(fundingLogs.wishItemId, ids.wishItemId)),
    e2eDb
      .select({ userId: bankAccounts.userId })
      .from(bankAccounts)
      .where(eq(bankAccounts.userId, ids.userId)),
  ]);

  return {
    users: userRows.length,
    sessions: sessionRows.length,
    wishlists: wishlistRows.length,
    wishItems: wishItemRows.length,
    messages: messageRows.length,
    fundingLogs: fundingRows.length,
    bankAccounts: bankRows.length,
  };
}
