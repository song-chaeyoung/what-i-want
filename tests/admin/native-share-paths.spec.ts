// spec: specs/admin-management.md
// seed: tests/fixtures/admin.ts

import { test, expect } from "../fixtures/admin";
import type { BrowserContext, Page } from "@playwright/test";
import type { SeededAdmin } from "../fixtures/admin";

type ShareOutcome = "resolve" | "AbortError" | "NotAllowedError";

type ShareStubWindow = Window & {
  __shareCalls: ShareData[];
  __clipboardWrites: string[];
};

async function openAdminHome(
  context: BrowserContext,
  outcome: ShareOutcome,
  signIn: (admin: Pick<SeededAdmin, "sessionToken">) => Promise<void>,
  admin: SeededAdmin,
): Promise<Page> {
  const page = await context.newPage();
  await signIn(admin);
  await page.addInitScript((shareOutcome: ShareOutcome) => {
    const stubWindow = window as unknown as ShareStubWindow;
    stubWindow.__shareCalls = [];
    stubWindow.__clipboardWrites = [];

    Object.defineProperty(navigator, "share", {
      value: (data: ShareData) => {
        stubWindow.__shareCalls.push(data);
        return shareOutcome === "resolve"
          ? Promise.resolve()
          : Promise.reject(new DOMException("x", shareOutcome));
      },
      configurable: true,
    });

    if (navigator.clipboard) {
      const originalWriteText = navigator.clipboard.writeText.bind(
        navigator.clipboard,
      );
      navigator.clipboard.writeText = (text: string) => {
        stubWindow.__clipboardWrites.push(text);
        return originalWriteText(text);
      };
    }
  }, outcome);

  await page.goto("/admin");
  await expect(page.getByText("내 공개 주소", { exact: true })).toBeVisible({
    timeout: 30_000,
  });
  return page;
}

test.describe("Admin home share", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  test("Native Share Paths", async ({ context, seedAdmin, signIn }) => {
    const admin = await seedAdmin();
    const shareUrl = `http://localhost:3200/wishlist/${admin.slug}?utm_source=owner_share&utm_medium=share`;

    // 1. [하위 케이스 A: 공유 성공] 새 페이지에서 `navigator.share` 가 성공하도록 스텁하고
    //    `/admin` 의 `공유하기` 를 클릭합니다.
    await test.step("A: 공유 성공", async () => {
      const page = await openAdminHome(context, "resolve", signIn, admin);
      const shareButton = page.getByRole("button", {
        name: /공유하기|복사 완료/,
      });

      await page.getByRole("button", { name: "공유하기" }).click();

      // expect: `navigator.share` 가 1번 호출되고 제목은 `뭐갖고싶어 생일 위시리스트`,
      // url 은 owner 공유 링크이다.
      await expect
        .poll(() =>
          page.evaluate(() => (window as unknown as ShareStubWindow).__shareCalls),
        )
        .toEqual([{ title: "뭐갖고싶어 생일 위시리스트", url: shareUrl }]);

      expect(
        await page.evaluate(
          () => (window as unknown as ShareStubWindow).__clipboardWrites,
        ),
      ).toEqual([]);
      await expect(
        page.getByText("위시리스트 링크를 복사했어요.", { exact: true }),
      ).toHaveCount(0);
      await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);
      await expect(shareButton).toHaveText("공유하기");

      await page.close();
    });

    // 2. [하위 케이스 B: 사용자가 공유 시트를 닫음] `AbortError` 로 reject 되면 토스트도 복사도 없다.
    await test.step("B: 사용자가 공유 시트를 닫음 (AbortError)", async () => {
      const page = await openAdminHome(context, "AbortError", signIn, admin);
      const shareButton = page.getByRole("button", {
        name: /공유하기|복사 완료/,
      });

      await page.getByRole("button", { name: "공유하기" }).click();

      await expect
        .poll(() =>
          page.evaluate(
            () => (window as unknown as ShareStubWindow).__shareCalls.length,
          ),
        )
        .toBe(1);

      await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);
      await expect(
        page.getByText("위시리스트 링크를 복사했어요.", { exact: true }),
      ).toHaveCount(0);
      await expect(
        page.getByText("링크 복사에 실패했어요. 주소를 직접 복사해주세요.", {
          exact: true,
        }),
      ).toHaveCount(0);
      await expect(shareButton).toHaveText("공유하기");
      expect(
        await page.evaluate(
          () => (window as unknown as ShareStubWindow).__clipboardWrites,
        ),
      ).toEqual([]);

      await page.close();
    });

    // 3. [하위 케이스 C: 공유 실패 후 폴백] `NotAllowedError` 이면 클립보드로 복사한다.
    await test.step("C: 공유 실패 후 클립보드 폴백 (NotAllowedError)", async () => {
      const page = await openAdminHome(context, "NotAllowedError", signIn, admin);
      const shareButton = page.getByRole("button", {
        name: /공유하기|복사 완료/,
      });

      await page.getByRole("button", { name: "공유하기" }).click();

      await expect(shareButton).toHaveText("복사 완료");
      await expect(
        page.getByText("위시리스트 링크를 복사했어요.", { exact: true }),
      ).toBeVisible();
      await expect
        .poll(() => page.evaluate(() => navigator.clipboard.readText()))
        .toBe(shareUrl);

      await page.close();
    });
  });
});
