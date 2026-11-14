// spec: specs/admin-management.md
// seed: tests/admin/seed-onboarding.spec.ts

import { eq } from "drizzle-orm";
import { profiles, wishlists } from "@/src/lib/db/schema";
import { test, expect } from "../fixtures/admin";

test.describe("Onboarding", () => {
  test("Complete Onboarding", async ({
    page,
    seedAdmin,
    signIn,
    e2eDb,
  }) => {
    // 1. [사전 조건] `seedAdmin({ onboarded: false, displayName: "소셜 이름" })`, `signIn(admin)`. `/onboarding` 으로 이동해 제목이 보일 때까지 기다립니다.
    const admin = await seedAdmin({
      onboarded: false,
      displayName: "소셜 이름",
    });
    await signIn(admin);

    await page.goto("/onboarding");
    await expect(
      page.getByRole("heading", { level: 1, name: "기본 위시리스트 만들기" }),
    ).toBeVisible({ timeout: 30_000 });

    const displayNameInput = page.getByRole("textbox", { name: "표시 이름" });
    const birthdayButton = page.locator("#birthday");
    const ageCheckbox = page.getByRole("checkbox", {
      name: /만 14세 이상입니다\./,
    });

    // expect: `표시 이름` 에 `소셜 이름` 이 미리 채워져 있다.
    await expect(displayNameInput).toHaveValue("소셜 이름");

    // expect: 버튼 `생일` 의 텍스트가 `생일을 선택하세요` 이다.
    await expect(birthdayButton).toHaveText("생일을 선택하세요");

    // expect: 체크박스 `만 14세 이상입니다.` 가 체크되어 있지 않다.
    await expect(ageCheckbox).not.toBeChecked();

    // 2. `표시 이름` 을 `E2E 생일자` 로 바꾸고, 버튼 `생일` 을 눌러 달력을 열어 2000년 3월 15일을 고릅니다.
    await displayNameInput.fill("E2E 생일자");
    await page.getByRole("button", { name: "생일" }).click();
    await page
      .getByRole("combobox", { name: "Choose the Year" })
      .selectOption("2000");
    await page
      .getByRole("combobox", { name: "Choose the Month" })
      .selectOption({ index: 2 });
    await page.getByRole("button", { name: /March 15th, 2000/ }).click();

    // expect: 달력 팝오버(`dialog`)가 닫힌다.
    await expect(page.getByRole("dialog")).toHaveCount(0);

    // expect: 버튼 `생일`(`#birthday`)의 텍스트가 `2000-03-15` 이고 hidden input `input[name=birthday]` 값이 `2000-03-15` 이다.
    await expect(birthdayButton).toHaveText("2000-03-15");
    await expect(page.locator("input[name=birthday]")).toHaveValue(
      "2000-03-15",
    );

    // expect: 버튼 `선택 해제` 가 보인다.
    await expect(page.getByRole("button", { name: "선택 해제" })).toBeVisible();

    // 3. `소개` 에 `올해도 잘 부탁해요` 를 입력하고 체크박스를 체크한 뒤 버튼 `위시리스트 만들기` 를 누릅니다.
    await page.getByRole("textbox", { name: "소개" }).fill("올해도 잘 부탁해요");
    await ageCheckbox.check();
    await page.getByRole("button", { name: "위시리스트 만들기" }).click();

    // expect: URL 이 `/admin` 이 된다(timeout 30초).
    await expect(page).toHaveURL(/\/admin$/, { timeout: 30_000 });

    // expect: 사이드바 링크 `홈`(exact)이 `aria-current="page"` 이고 계정 이메일 `admin.email` 이 보인다.
    const sidebar = page.getByRole("complementary");
    await expect(
      sidebar.getByRole("link", { name: "홈", exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await expect(sidebar.getByText(admin.email)).toBeVisible();

    // expect: 첫 진입 안내 모달(`dialog`)이 없다(`signIn` 이 꺼 둠).
    await expect(page.getByRole("dialog")).toHaveCount(0);

    // expect: 링크 `공개 페이지 보기` 의 href 가 `/wishlist/w-` 로 시작한다.
    const publicLink = page
      .getByRole("link", { name: "공개 페이지 보기" })
      .first();
    await expect(publicLink).toHaveAttribute("href", /^\/wishlist\/w-/);
    const publicHref = await publicLink.getAttribute("href");
    const publicSlug = publicHref!.replace("/wishlist/", "");

    // 4. [e2eDb 조회, 코드 근거] `profiles`·`wishlists` 를 이 사용자로 조회합니다.
    // expect: `profiles` 가 1행이고 `displayName` `E2E 생일자`, `birthday` `2000-03-15`, `description` `올해도 잘 부탁해요`, `onboardingCompletedAt` 이 null 이 아니다.
    await expect
      .poll(async () =>
        e2eDb.select().from(profiles).where(eq(profiles.userId, admin.userId)),
      )
      .toHaveLength(1);
    const [savedProfile] = await e2eDb
      .select()
      .from(profiles)
      .where(eq(profiles.userId, admin.userId));
    expect(savedProfile.displayName).toBe("E2E 생일자");
    expect(savedProfile.birthday).toBe("2000-03-15");
    expect(savedProfile.description).toBe("올해도 잘 부탁해요");
    expect(savedProfile.onboardingCompletedAt).not.toBeNull();

    // expect: `wishlists` 가 1행이고 `title` `E2E 생일자님의 위시리스트`, `visibility` `public`, `slug` 가 위 링크의 slug 와 같다.
    const savedWishlists = await e2eDb
      .select()
      .from(wishlists)
      .where(eq(wishlists.ownerId, admin.userId));
    expect(savedWishlists).toHaveLength(1);
    expect(savedWishlists[0].title).toBe("E2E 생일자님의 위시리스트");
    expect(savedWishlists[0].visibility).toBe("public");
    expect(savedWishlists[0].slug).toBe(publicSlug);

    // 5. `/onboarding` 으로 다시 이동합니다.
    await page.goto("/onboarding");

    // expect: URL 이 `/admin` 이 된다(온보딩을 마친 사용자는 온보딩 화면에 머물지 않음).
    await expect(page).toHaveURL(/\/admin$/, { timeout: 30_000 });
  });
});
