// spec: specs/admin-management.md
// seed: tests/admin/seed-settings.spec.ts

import { eq } from "drizzle-orm";
import { users } from "@/src/lib/db/schema";
import { test, expect } from "../fixtures/admin";

import { WITHDRAWAL_COPY } from "@/src/lib/design/copy";

test.describe("Withdraw Account", () => {
  test("Cancel Withdraw Account", async ({ page, seedAdmin, signIn, e2eDb }) => {
    // 1. [사전 조건] 계정 섹션 다음에 회원 탈퇴가 있다.
    const admin = await seedAdmin();
    await signIn(admin);

    await page.goto("/admin/settings");
    const withdrawButton = page.getByRole("button", {
      name: "회원 탈퇴",
      exact: true,
    });
    await expect(withdrawButton).toBeVisible({ timeout: 30_000 });

    const withdrawal = page.locator("section[data-slot='card']").filter({
      has: page.getByRole("heading", { level: 3, name: "회원 탈퇴" }),
    });
    await expect(withdrawal).toContainText(
      "계정과 위시리스트, 선물, 받은 메시지, 계좌 정보가 바로 모두 삭제되고 되돌릴 수 없어요.",
    );
    await expect(withdrawal.getByRole("button", { name: "로그아웃" })).toHaveCount(
      0,
    );

    // 2. 확인창은 Esc와 취소로 닫히고 계정은 그대로다.
    const dialog = page.getByRole("alertdialog", {
      name: WITHDRAWAL_COPY.confirm.title,
    });
    await withdrawButton.click();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(WITHDRAWAL_COPY.confirm.description)).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "취소", exact: true }),
    ).toBeFocused();
    await page.mouse.click(8, 8);
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(withdrawButton).toBeFocused();

    await withdrawButton.click();
    await dialog.getByRole("button", { name: "취소", exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);
    await expect(page).toHaveURL(/\/admin\/settings$/);
    await expect(withdrawButton).toBeVisible();
    await expect
      .poll(async () =>
        e2eDb.select({ id: users.id }).from(users).where(eq(users.id, admin.userId)),
      )
      .toHaveLength(1);

    // 3. 삭제 요청이 아니면 설정에 남고 실패 토스트만 보인다.
    const rejected = await page.request.post("/api/admin/account/withdraw", {
      form: { userId: "someone-else" },
      maxRedirects: 0,
    });
    expect(rejected.status()).toBe(307);
    const location = rejected.headers().location ?? "";
    const locationUrl = new URL(location, "http://localhost:3200");
    expect(locationUrl.pathname).toBe("/admin/settings");
    expect(locationUrl.searchParams.get("error")).toBe("withdraw_failed");

    await page.goto(`${locationUrl.pathname}${locationUrl.search}`);
    const errorToast = page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "탈퇴하지 못했어요. 잠시 후 다시 시도해 주세요." });
    await expect(errorToast).toBeVisible({ timeout: 10_000 });
    await expect(errorToast).toHaveAttribute("data-type", "error");
    await expect(page).toHaveURL(/\/admin\/settings$/, { timeout: 10_000 });
    await expect
      .poll(async () =>
        e2eDb.select({ id: users.id }).from(users).where(eq(users.id, admin.userId)),
      )
      .toHaveLength(1);
  });
});
