// spec: specs/admin-management.md
// seed: tests/admin/seed-settings.spec.ts

import { eq } from "drizzle-orm";
import { bankAccounts } from "@/src/lib/db/schema";
import { ADMIN_COPY } from "@/src/lib/design/copy";
import { test, expect } from "../fixtures/admin";

test.describe("Bank Account Deletion", () => {
  test("Cancel Delete Bank Account", async ({
    page,
    seedAdmin,
    signIn,
    e2eDb,
  }) => {
    // 1. [사전 조건] 계좌가 있는 관리자로 로그인하고 삭제 전 암호문을 보관한다.
    const admin = await seedAdmin({
      bankAccount: {
        bankName: "E2E은행",
        accountHolder: "E2E 관리자",
        accountNumber: "123-456-789012",
        visibility: "copy_only",
      },
    });
    await signIn(admin);

    const loadAccounts = () =>
      e2eDb
        .select()
        .from(bankAccounts)
        .where(eq(bankAccounts.userId, admin.userId));
    const before = (await loadAccounts())[0]?.accountNumberEncrypted;

    await page.goto("/admin/settings");
    const deleteButton = page.getByRole("button", {
      name: "계좌 삭제",
      exact: true,
    });
    await expect(deleteButton).toBeVisible({ timeout: 30_000 });

    // expect: 저장된 계좌 칸이 그대로 보인다.
    await expect(page.locator("#bankName")).toHaveValue("E2E은행");
    await expect(page.locator("#accountHolder")).toHaveValue("E2E 관리자");
    await expect(page.locator("#accountNumber")).toHaveAttribute(
      "placeholder",
      "변경할 때만 입력",
    );
    await expect(page.locator("#accountVisibility")).toBeEnabled();
    await expect(page.locator("#accountVisibility")).toHaveValue("copy_only");

    // 2. 확인창은 Esc와 취소로 닫히고 계좌는 바뀌지 않는다.
    const dialog = page.getByRole("alertdialog", {
      name: ADMIN_COPY.deleteBankAccountConfirm.title,
    });
    await deleteButton.click();
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText(ADMIN_COPY.deleteBankAccountConfirm.description)).toBeVisible();
    const cancelButton = dialog.getByRole("button", { name: "취소", exact: true });
    await expect(cancelButton).toBeFocused();
    await page.mouse.click(8, 8);
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(deleteButton).toBeFocused();

    await deleteButton.click();
    await dialog.getByRole("button", { name: "취소", exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);
    await expect(page).toHaveURL(/\/admin\/settings$/);
    await expect(page.locator("#bankName")).toHaveValue("E2E은행");
    await expect(page.locator("#accountHolder")).toHaveValue("E2E 관리자");
    await expect(page.locator("#accountNumber")).toHaveAttribute(
      "placeholder",
      "변경할 때만 입력",
    );
    await expect(deleteButton).toBeVisible();

    const remaining = await loadAccounts();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].accountNumberEncrypted).toBe(before);
  });
});
