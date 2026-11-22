// spec: specs/admin-management-2.md
// seed: tests/admin/seed-settings.spec.ts

import { eq } from "drizzle-orm";
import { decryptAccountNumber } from "@/src/lib/settings/account-crypto";
import { bankAccounts } from "@/src/lib/db/schema";
import { E2E_ACCOUNT_ENCRYPTION_SECRET } from "../support/e2e-db";
import { test, expect } from "../fixtures/admin";

test.describe("Settings", () => {
  test("Hide Bank Account", async ({ page, seedAdmin, signIn, e2eDb }) => {
    // 1. [사전 조건] seedAdmin({ bankAccount: E2E은행 copy_only }), signIn(admin). e2eDb 로 `accountNumberEncrypted` 를 `before` 에 보관하고 공개 페이지, 이어서 `/admin/settings` 로 이동합니다.
    const admin = await seedAdmin({
      bankAccount: {
        bankName: "E2E은행",
        accountHolder: "E2E 관리자",
        accountNumber: "123-456-789012",
        visibility: "copy_only",
      },
    });
    await signIn(admin);

    const loadAccount = async () =>
      (
        await e2eDb
          .select()
          .from(bankAccounts)
          .where(eq(bankAccounts.userId, admin.userId))
      )[0];
    const before = (await loadAccount()).accountNumberEncrypted;

    await page.goto(`/wishlist/${admin.slug}`);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "E2E 관리자님의 위시리스트",
      }),
    ).toBeVisible({ timeout: 30_000 });

    // expect: 공개 페이지에 `계좌 안내` details 가 1개 있다(숨기기 전 기준값).
    const accountSection = page
      .locator("details")
      .filter({ hasText: "gift account" });
    await expect(accountSection).toHaveCount(1);

    await page.goto("/admin/settings");
    const accountVisibility = page.locator("#accountVisibility");
    const accountNumber = page.locator("#accountNumber");
    await expect(accountVisibility).toBeVisible({ timeout: 30_000 });

    // expect: 설정에서 `은행` `E2E은행`, `예금주` `E2E 관리자`, `계좌번호` 빈 값·placeholder `변경할 때만 입력`, `계좌 공개` 값 `copy_only`·활성 상태, 힌트가 복사 안내이다.
    await expect(page.locator("#bankName")).toHaveValue("E2E은행");
    await expect(page.locator("#accountHolder")).toHaveValue("E2E 관리자");
    await expect(accountNumber).toHaveValue("");
    await expect(accountNumber).toHaveAttribute("placeholder", "변경할 때만 입력");
    await expect(accountVisibility).toBeEnabled();
    await expect(accountVisibility).toHaveValue("copy_only");
    await expect(
      page.getByText("공개 페이지를 방문한 사람은 계좌번호를 복사할 수 있어요."),
    ).toBeVisible();

    // 2. `계좌 공개` 를 `hidden`(옵션 `숨기기`)으로 바꿉니다(아직 저장 안 함).
    await accountVisibility.selectOption("hidden");

    // expect: 힌트가 `공개 페이지에 계좌가 보이지 않아요.` 로 바뀐다(클라이언트 상태).
    await expect(
      page.getByText("공개 페이지에 계좌가 보이지 않아요."),
    ).toBeVisible();

    // 3. `계좌번호` 칸은 비워 둔 채 `저장하기` 를 누릅니다.
    await page.getByRole("button", { name: "저장하기" }).click();

    // expect: 토스트 `설정을 저장했어요.` 가 보이고 URL 이 `/admin/settings` 로 정리된다.
    const toast = page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "설정을 저장했어요." });
    await expect(toast).toBeVisible({ timeout: 10_000 });
    await expect(toast).toHaveAttribute("data-type", "success");
    await expect(page).toHaveURL(/\/admin\/settings$/, { timeout: 10_000 });

    // expect: 다시 렌더된 `계좌 공개` 값이 `hidden`, 힌트가 `공개 페이지에 계좌가 보이지 않아요.`, `은행` 이 `E2E은행`, placeholder 가 `변경할 때만 입력` 이다(서버 렌더 결과).
    await expect(accountVisibility).toHaveValue("hidden");
    await expect(
      page.getByText("공개 페이지에 계좌가 보이지 않아요."),
    ).toBeVisible();
    await expect(page.locator("#bankName")).toHaveValue("E2E은행");
    await expect(accountNumber).toHaveAttribute("placeholder", "변경할 때만 입력");

    // 4. [e2eDb 조회, 코드 근거] `expect.poll` 로 `bankAccounts`(`userId = admin.userId`)를 조회합니다.
    // expect: `visibility` 가 `hidden` 이다.
    await expect
      .poll(async () => (await loadAccount()).visibility, { timeout: 10_000 })
      .toBe("hidden");

    // expect: `bankName`·`accountHolder` 그대로이고 `accountNumberEncrypted` 가 `before` 와 같다(복호화하면 `123-456-789012`).
    const after = await loadAccount();
    expect(after.bankName).toBe("E2E은행");
    expect(after.accountHolder).toBe("E2E 관리자");
    expect(after.accountNumberEncrypted).toBe(before);
    expect(
      decryptAccountNumber(
        after.accountNumberEncrypted,
        E2E_ACCOUNT_ENCRYPTION_SECRET,
      ),
    ).toBe("123-456-789012");

    // 5. `/wishlist/${admin.slug}` 로 이동해 레벨 1 제목을 기다립니다(timeout 30초).
    await page.goto(`/wishlist/${admin.slug}`);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "E2E 관리자님의 위시리스트",
      }),
    ).toBeVisible({ timeout: 30_000 });

    // expect: `계좌 안내` 텍스트가 없다(count 0). 첫 단계에서 같은 페이지에 있던 것과 짝이다.
    await expect(page.getByText("계좌 안내")).toHaveCount(0);
    await expect(accountSection).toHaveCount(0);
  });
});
