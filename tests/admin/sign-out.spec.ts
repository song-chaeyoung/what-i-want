// spec: specs/admin-management-2.md
// seed: tests/admin/seed-settings.spec.ts

import { eq } from "drizzle-orm";
import { sessions } from "@/src/lib/db/schema";
import { test, expect } from "../fixtures/admin";

const SESSION_COOKIE = "authjs.session-token";

test.describe("Sign Out", () => {
  test("Sign Out", async ({ page, context, seedAdmin, signIn, e2eDb }) => {
    // 1. [사전 조건] seedAdmin, signIn 한 뒤 `/admin/settings` 에서 버튼 `로그아웃` 을 기다립니다.
    const admin = await seedAdmin();
    await signIn(admin);

    await page.goto("/admin/settings");
    const signOutButton = page.getByRole("button", { name: "로그아웃" });
    await expect(signOutButton).toBeVisible({ timeout: 30_000 });

    // expect: `계정` 섹션에 설명 `현재 기기에서 로그아웃합니다.` 와 버튼 `로그아웃` 이 있다.
    await expect(page.getByText("현재 기기에서 로그아웃합니다.")).toBeVisible();

    // expect: 세션 쿠키 `authjs.session-token` 이 `admin.sessionToken` 값으로 있다.
    const cookiesBefore = await context.cookies();
    expect(
      cookiesBefore.find((cookie) => cookie.name === SESSION_COOKIE)?.value,
    ).toBe(admin.sessionToken);

    // 2. 버튼 `로그아웃` 을 누릅니다.
    await signOutButton.click();

    // expect: URL 이 `http://localhost:3200/login` 이 된다(`webServer.env.AUTH_URL` 이 3200).
    await expect(page).toHaveURL("http://localhost:3200/login", {
      timeout: 15_000,
    });

    // expect: 레벨 1 제목 `로그인` 과 버튼 `Google로 계속하기` 가 보인다.
    await expect(
      page.getByRole("heading", { level: 1, name: "로그인" }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("button", { name: "Google로 계속하기" }),
    ).toBeVisible();

    // expect: [e2eDb 조회, 코드 근거] `sessions` 행이 0개가 된다(database 세션이라 로그아웃이 행을 지움).
    await expect
      .poll(
        async () =>
          (
            await e2eDb
              .select()
              .from(sessions)
              .where(eq(sessions.sessionToken, admin.sessionToken))
          ).length,
        { timeout: 15_000 },
      )
      .toBe(0);

    // expect: `authjs.session-token` 쿠키가 없다.
    const cookiesAfter = await context.cookies();
    expect(
      cookiesAfter.find((cookie) => cookie.name === SESSION_COOKIE),
    ).toBeUndefined();

    // 3. `/admin` 으로 이동합니다.
    await page.goto("/admin");

    // expect: URL 이 `/login` 이 되고 버튼 `Google로 계속하기` 가 보이며 사이드바(`complementary`)는 없다.
    await expect(page).toHaveURL(/\/login$/, { timeout: 30_000 });
    await expect(
      page.getByRole("button", { name: "Google로 계속하기" }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("complementary")).toHaveCount(0);
  });
});
