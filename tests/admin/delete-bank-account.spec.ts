// spec: specs/admin-management.md
// seed: tests/admin/seed-settings.spec.ts

import { eq } from "drizzle-orm";
import { decryptAccountNumber } from "@/src/lib/settings/account-crypto";
import { bankAccounts } from "@/src/lib/db/schema";
import { E2E_ACCOUNT_ENCRYPTION_SECRET } from "../support/e2e-db";
import { test, expect } from "../fixtures/admin";

test.describe("Bank Account Deletion", () => {
  test("Delete Bank Account", async ({ page, seedAdmin, signIn, e2eDb }) => {
    // 1. [사전 조건] 계좌가 있는 공개 페이지를 먼저 열어 캐시를 채운다.
    const admin = await seedAdmin({
      displayName: "E2E 관리자",
      bankAccount: {
        bankName: "E2E은행",
        accountHolder: "E2E 관리자",
        accountNumber: "123-456-789012",
        visibility: "copy_only",
      },
    });
    await signIn(admin);

    await page.goto(`/wishlist/${admin.slug}`);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "E2E 관리자님의 위시리스트",
      }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("계좌 안내", { exact: true })).toBeVisible();

    await page.goto("/admin/settings");
    const deleteButton = page.getByRole("button", { name: "계좌 삭제" });
    await expect(deleteButton).toBeVisible({ timeout: 30_000 });

    // 2. 확인 창을 수락해 계좌를 삭제한다.
    page.once("dialog", (dialog) => dialog.accept());
    await deleteButton.click();

    const deletedToast = page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "계좌 정보를 삭제했어요." });
    await expect(deletedToast).toBeVisible({ timeout: 10_000 });
    await expect(deletedToast).toHaveAttribute("data-type", "success");
    await expect(page).toHaveURL(/\/admin\/settings$/, { timeout: 10_000 });

    // expect: 계좌를 등록하지 않은 화면과 같다.
    await expect(page.locator("#bankName")).toHaveValue("");
    await expect(page.locator("#accountHolder")).toHaveValue("");
    await expect(page.locator("#accountNumber")).toHaveAttribute(
      "placeholder",
      "3333-12-1234567",
    );
    await expect(page.locator("#accountVisibility")).toBeDisabled();
    await expect(page.getByRole("button", { name: "계좌 삭제" })).toHaveCount(0);

    const loadAccounts = () =>
      e2eDb
        .select()
        .from(bankAccounts)
        .where(eq(bankAccounts.userId, admin.userId));
    await expect.poll(async () => (await loadAccounts()).length).toBe(0);

    // 3. 공개 페이지에서 계좌 안내가 사라진다.
    await page.goto(`/wishlist/${admin.slug}`);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "E2E 관리자님의 위시리스트",
      }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("계좌 안내", { exact: true })).toHaveCount(0);

    // 4. 다시 입력하면 새 계좌로 저장된다.
    await page.goto("/admin/settings");
    await expect(page.locator("#bankName")).toBeVisible({ timeout: 30_000 });
    await page.locator("#bankName").fill("새은행");
    await page.locator("#accountHolder").fill("홍길동");
    await page.locator("#accountNumber").fill("987-654-321098");
    await page.getByRole("button", { name: "저장하기" }).click();

    const savedToast = page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "설정을 저장했어요." });
    await expect(savedToast).toBeVisible({ timeout: 10_000 });
    await expect.poll(async () => (await loadAccounts()).length).toBe(1);
    const [saved] = await loadAccounts();
    expect(saved.bankName).toBe("새은행");
    expect(saved.accountHolder).toBe("홍길동");
    expect(
      decryptAccountNumber(
        saved.accountNumberEncrypted,
        E2E_ACCOUNT_ENCRYPTION_SECRET,
      ),
    ).toBe("987-654-321098");

    await page.goto(`/wishlist/${admin.slug}`);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "E2E 관리자님의 위시리스트",
      }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("계좌 안내", { exact: true })).toHaveCount(1);

    // 5. form POST도 세션 사용자의 계좌만 지운다.
    const formDelete = await page.request.post(
      "/api/admin/settings/bank-account",
      { form: { _method: "delete" }, maxRedirects: 0 },
    );
    expect(formDelete.status()).toBe(307);
    const location = new URL(formDelete.headers()["location"]);
    expect(location.pathname).toBe("/admin/settings");
    expect(location.search).toBe("?accountDeleted=1");
    await expect.poll(async () => (await loadAccounts()).length).toBe(0);
  });
});
