// spec: specs/admin-management.md
// seed: tests/admin/seed-onboarding.spec.ts

import { eq } from "drizzle-orm";
import { profiles, wishlists } from "@/src/lib/db/schema";
import { test, expect } from "../fixtures/admin";

test.describe("Onboarding", () => {
  test("Onboarding Age Confirmation Required", async ({
    page,
    seedAdmin,
    signIn,
    e2eDb,
  }) => {
    // 1. [사전 조건] `seedAdmin({ onboarded: false })`, `signIn(admin)`. `/onboarding` 으로 이동해 제목을 기다립니다.
    const admin = await seedAdmin({ onboarded: false });
    await signIn(admin);

    await page.goto("/onboarding");
    await expect(
      page.getByRole("heading", { level: 1, name: "기본 위시리스트 만들기" }),
    ).toBeVisible({ timeout: 30_000 });

    // 2. 체크박스를 체크하지 않은 채 버튼 `위시리스트 만들기` 를 누릅니다.
    await page.getByRole("button", { name: "위시리스트 만들기" }).click();

    // expect: URL 이 `/onboarding` 그대로이다(브라우저 검증이 제출을 막음).
    await expect(page).toHaveURL(/\/onboarding$/);

    // expect: 체크박스의 `validity.valueMissing` 이 `true` 이다.
    const ageCheckbox = page.getByRole("checkbox", {
      name: /만 14세 이상입니다\./,
    });
    expect(
      await ageCheckbox.evaluate(
        (el) => (el as HTMLInputElement).validity.valueMissing,
      ),
    ).toBe(true);

    // 3. 브라우저 검증을 건너뛰는 경우를 확인합니다(ageConfirmed 없음).
    const response = await page.request.post("/api/onboarding", {
      form: { displayName: "확인 안 함", birthday: "2000-03-15" },
      maxRedirects: 0,
    });

    // expect: 상태 `307`, `location` 의 pathname 이 `/onboarding`, search 가 `?error=age_confirmation_required` 이다.
    expect(response.status()).toBe(307);
    const location = new URL(response.headers()["location"]);
    expect(location.pathname).toBe("/onboarding");
    expect(location.search).toBe("?error=age_confirmation_required");

    // 4. 그 `location` 으로 이동합니다.
    await page.goto(location.pathname + location.search);

    // expect: 문구 `만 14세 이상인지 확인해주세요.` 가 보인다.
    await expect(
      page.getByText("만 14세 이상인지 확인해주세요."),
    ).toBeVisible({ timeout: 30_000 });

    // 5. [e2eDb 조회, 코드 근거] `profiles`·`wishlists` 를 이 사용자로 조회합니다.
    const savedProfiles = await e2eDb
      .select()
      .from(profiles)
      .where(eq(profiles.userId, admin.userId));
    const savedWishlists = await e2eDb
      .select()
      .from(wishlists)
      .where(eq(wishlists.ownerId, admin.userId));

    // expect: 둘 다 0행이다.
    expect(savedProfiles).toHaveLength(0);
    expect(savedWishlists).toHaveLength(0);

    // 6. `/admin` 으로 이동합니다.
    await page.goto("/admin");

    // expect: URL 이 `/onboarding` 이 된다(아직 온보딩 미완료).
    await expect(page).toHaveURL(/\/onboarding$/, { timeout: 30_000 });
  });
});
