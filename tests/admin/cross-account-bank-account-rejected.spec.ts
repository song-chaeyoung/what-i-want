// spec: specs/admin-management.md
// seed: tests/admin/seed-settings.spec.ts

import { eq } from "drizzle-orm";
import { bankAccounts } from "@/src/lib/db/schema";
import { test, expect } from "../fixtures/admin";

test.describe("Cross Account Access", () => {
  test("Cross Account Bank Account Rejected", async ({
    page,
    seedAdmin,
    signIn,
    e2eDb,
  }) => {
    // 1. [사전 조건] 주인 B 의 계좌만 있고, 요청자 A 만 로그인한다.
    const owner = await seedAdmin({
      displayName: "E2E 주인",
      bankAccount: {
        bankName: "E2E은행",
        accountHolder: "E2E 주인",
        accountNumber: "123-456-789012",
        visibility: "copy_only",
      },
    });
    const other = await seedAdmin({ displayName: "E2E 다른 사람" });
    await signIn(other);

    const loadOwnerAccounts = () =>
      e2eDb
        .select()
        .from(bankAccounts)
        .where(eq(bankAccounts.userId, owner.userId));
    const before = (await loadOwnerAccounts())[0]?.accountNumberEncrypted;

    const endpoint = "/api/admin/settings/bank-account";

    // 2. 본문에 주인 id 를 넣어도 form 삭제는 A 의 계좌만 대상으로 실패한다.
    const formResponse = await page.request.post(endpoint, {
      form: { _method: "delete", userId: owner.userId },
      maxRedirects: 0,
    });

    expect(formResponse.status()).toBe(307);
    const formLocation = new URL(formResponse.headers()["location"]);
    expect(formLocation.pathname).toBe("/admin/settings");
    expect(formLocation.search).toBe("?error=bank_account_delete_failed");

    // 3. [e2eDb] B 의 계좌는 그대로이고 A 의 계좌 행은 없다.
    const ownerAccounts = await loadOwnerAccounts();
    expect(ownerAccounts).toHaveLength(1);
    expect(ownerAccounts[0].accountNumberEncrypted).toBe(before);

    const otherAccounts = await e2eDb
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.userId, other.userId));
    expect(otherAccounts).toHaveLength(0);
  });
});
