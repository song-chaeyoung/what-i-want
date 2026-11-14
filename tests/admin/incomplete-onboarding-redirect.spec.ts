// spec: specs/admin-management.md
// seed: tests/admin/seed.spec.ts

import { eq } from "drizzle-orm";
import { profiles, wishlists } from "@/src/lib/db/schema";
import { test, expect } from "../fixtures/admin";

test.describe("Admin Login Boundary", () => {
  test("Incomplete Onboarding Redirects To Onboarding", async ({
    page,
    seedAdmin,
    signIn,
    e2eDb,
  }) => {
    // 1. [사전 조건] `seedAdmin({ onboarded: false })`, `signIn(admin)`.
    const admin = await seedAdmin({ onboarded: false });
    await signIn(admin);

    // expect: `admin.wishlistId` 가 null 이다.
    expect(admin.wishlistId).toBeNull();

    const onboardingHeading = page.getByRole("heading", {
      level: 1,
      name: "기본 위시리스트 만들기",
    });

    // 2. `/admin` 으로 이동합니다.
    await page.goto("/admin");

    // expect: URL 이 `/onboarding` 이 되고 레벨 1 제목 `기본 위시리스트 만들기` 가 보인다.
    await expect(page).toHaveURL(/\/onboarding$/, { timeout: 30_000 });
    await expect(onboardingHeading).toBeVisible();

    // expect: 사이드바(`complementary`)가 없다.
    await expect(page.getByRole("complementary")).toHaveCount(0);

    // 3. `/admin/wishes`, `/admin/messages` 로 차례로 이동합니다.
    for (const path of ["/admin/wishes", "/admin/messages"]) {
      await page.goto(path);

      // expect: 각각 URL 이 `/onboarding` 이 되고 레벨 1 제목 `기본 위시리스트 만들기` 가 보인다.
      await expect(page).toHaveURL(/\/onboarding$/, { timeout: 30_000 });
      await expect(onboardingHeading).toBeVisible();
    }

    // 4. [e2eDb 조회, 코드 근거] `profiles`·`wishlists` 를 이 사용자로 조회합니다.
    const savedProfiles = await e2eDb
      .select()
      .from(profiles)
      .where(eq(profiles.userId, admin.userId));
    const savedWishlists = await e2eDb
      .select()
      .from(wishlists)
      .where(eq(wishlists.ownerId, admin.userId));

    // expect: `profiles` 와 `wishlists` 가 0행이다(경계가 데이터를 만들지 않음).
    expect(savedProfiles).toHaveLength(0);
    expect(savedWishlists).toHaveLength(0);
  });
});
