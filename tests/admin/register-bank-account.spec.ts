// spec: specs/admin-management-2.md
// seed: tests/admin/seed-settings.spec.ts

import { eq } from "drizzle-orm";
import { decryptAccountNumber } from "@/src/lib/settings/account-crypto";
import { bankAccounts } from "@/src/lib/db/schema";
import { E2E_ACCOUNT_ENCRYPTION_SECRET } from "../support/e2e-db";
import { test, expect } from "../fixtures/admin";

test.describe("Settings", () => {
  test("Register Bank Account", async ({ page, seedAdmin, signIn, e2eDb }) => {
    // 1. [사전 조건] seedAdmin()(계좌 없음), signIn(admin). `/admin/settings` 로 이동해 `#accountVisibility` 를 기다립니다(timeout 30초).
    const admin = await seedAdmin();
    await signIn(admin);

    await page.goto("/admin/settings");
    const bankName = page.locator("#bankName");
    const accountHolder = page.locator("#accountHolder");
    const accountNumber = page.locator("#accountNumber");
    const accountVisibility = page.locator("#accountVisibility");
    await expect(accountVisibility).toBeVisible({ timeout: 30_000 });

    // expect: `은행`·`예금주` 가 빈 값, `계좌번호` 의 placeholder 가 `3333-12-1234567` 이다.
    await expect(bankName).toHaveValue("");
    await expect(accountHolder).toHaveValue("");
    await expect(accountNumber).toHaveAttribute(
      "placeholder",
      "3333-12-1234567",
    );

    // expect: `계좌 공개` select 가 disabled 이고 값은 `copy_only`, 힌트는 `공개 페이지를 방문한 사람은 계좌번호를 복사할 수 있어요.` 이다.
    await expect(accountVisibility).toBeDisabled();
    await expect(accountVisibility).toHaveValue("copy_only");
    await expect(
      page.getByText("공개 페이지를 방문한 사람은 계좌번호를 복사할 수 있어요."),
    ).toBeVisible();

    // 2. `은행` `E2E은행`, `예금주` `홍길동`, `계좌번호` `123-456-789012` 를 입력하고 `저장하기` 를 누릅니다.
    await bankName.fill("E2E은행");
    await accountHolder.fill("홍길동");
    await accountNumber.fill("123-456-789012");
    await page.getByRole("button", { name: "저장하기" }).click();

    // expect: 토스트 `설정을 저장했어요.`(`data-type` `success`)가 보이고 URL 이 `/admin/settings` 로 정리된다. 계좌 없음 경고 토스트는 나오지 않는다.
    const toasts = page.locator("[data-sonner-toast]");
    const toast = toasts.filter({ hasText: "설정을 저장했어요." });
    await expect(toast).toBeVisible({ timeout: 10_000 });
    await expect(toast).toHaveAttribute("data-type", "success");
    await expect(page).toHaveURL(/\/admin\/settings$/, { timeout: 10_000 });
    await expect(toasts).toHaveCount(1);

    // expect: 다시 렌더된 `은행` 이 `E2E은행`, `예금주` 가 `홍길동` 이다.
    await expect(bankName).toHaveValue("E2E은행");
    await expect(accountHolder).toHaveValue("홍길동");

    // expect: `계좌번호` 입력이 빈 값이고 placeholder 가 `변경할 때만 입력` 이다(서버 렌더 결과).
    await expect(accountNumber).toHaveValue("");
    await expect(accountNumber).toHaveAttribute("placeholder", "변경할 때만 입력");

    // expect: `계좌 공개` select 가 활성화되고 값은 `copy_only` 이다.
    await expect(accountVisibility).toBeEnabled();
    await expect(accountVisibility).toHaveValue("copy_only");

    // 3. [e2eDb 조회, 코드 근거] `expect.poll` 로 `bankAccounts`(`userId = admin.userId`)를 조회합니다.
    const loadAccounts = () =>
      e2eDb
        .select()
        .from(bankAccounts)
        .where(eq(bankAccounts.userId, admin.userId));
    await expect.poll(async () => (await loadAccounts()).length).toBe(1);

    // expect: 1행이고 `bankName` `E2E은행`, `accountHolder` `홍길동`, `visibility` `copy_only` 이다.
    const [account] = await loadAccounts();
    expect(account.bankName).toBe("E2E은행");
    expect(account.accountHolder).toBe("홍길동");
    expect(account.visibility).toBe("copy_only");

    // expect: `accountNumberEncrypted` 는 평문이 아니고 복호화하면 `123-456-789012` 이다.
    expect(account.accountNumberEncrypted).not.toBe("123-456-789012");
    expect(
      decryptAccountNumber(
        account.accountNumberEncrypted,
        E2E_ACCOUNT_ENCRYPTION_SECRET,
      ),
    ).toBe("123-456-789012");

    // 4. `/wishlist/${admin.slug}` 로 이동해 레벨 1 제목을 기다리고, `계좌 안내` 가 든 `details` 를 찾습니다.
    await page.goto(`/wishlist/${admin.slug}`);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "E2E 관리자님의 위시리스트",
      }),
    ).toBeVisible({ timeout: 30_000 });
    const accountSection = page
      .locator("details")
      .filter({ hasText: "gift account" });

    // expect: `details`(요약 `gift account`·`계좌 안내`·`마음은 이 계좌로 전할 수 있어요.`)가 1개이고 `open` 이 false 이다.
    await expect(accountSection).toHaveCount(1);
    await expect(accountSection).toContainText("gift account");
    await expect(accountSection).toContainText("계좌 안내");
    await expect(accountSection).toContainText("마음은 이 계좌로 전할 수 있어요.");
    await expect(accountSection).toHaveJSProperty("open", false);

    // expect: `summary` 를 눌러 열면 `예금주` `홍길동` 과 버튼 `계좌번호 복사` 가 보이고, 은행 이름과 계좌번호 문자열은 화면에 없다.
    await accountSection.locator("summary").click();
    await expect(accountSection).toHaveJSProperty("open", true);
    await expect(accountSection.getByText("예금주", { exact: true })).toBeVisible();
    await expect(accountSection.getByText("홍길동", { exact: true })).toBeVisible();
    await expect(
      accountSection.getByRole("button", { name: "계좌번호 복사" }),
    ).toBeVisible();
    await expect(page.getByText("E2E은행")).toHaveCount(0);
    await expect(page.getByText("123-456-789012")).toHaveCount(0);
  });
});
