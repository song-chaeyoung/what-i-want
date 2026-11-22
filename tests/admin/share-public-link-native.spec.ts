// spec: specs/admin-management-2.md
// seed: tests/admin/seed-settings.spec.ts

import { test, expect } from "../fixtures/admin";

// 스텁이 기록하는 window 전역값의 타입
type ShareStubWindow = Window & {
  __shareCalls: ShareData[];
  __clipWrites: number;
};

test.describe("Share Public Link", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  test("Native Share", async ({ page, seedAdmin, signIn }) => {
    // 1. [사전 조건] seedAdmin, signIn, `navigator.share` 를 호출 기록 후 resolve 하는 함수로 스텁하고 `clipboard.writeText` 호출을 세는 init script 를 넣은 뒤 `/admin` 에서 `내 공개 주소` 를 기다립니다.
    const admin = await seedAdmin();
    await signIn(admin);
    await page.addInitScript(() => {
      const stubWindow = window as unknown as ShareStubWindow;
      stubWindow.__shareCalls = [];
      stubWindow.__clipWrites = 0;

      Object.defineProperty(navigator, "share", {
        value: async (data: ShareData) => {
          stubWindow.__shareCalls.push(data);
        },
        configurable: true,
      });

      if (navigator.clipboard) {
        const originalWriteText = navigator.clipboard.writeText.bind(
          navigator.clipboard,
        );
        navigator.clipboard.writeText = (text: string) => {
          stubWindow.__clipWrites += 1;
          return originalWriteText(text);
        };
      }
    });

    await page.goto("/admin");
    await expect(page.getByText("내 공개 주소", { exact: true })).toBeVisible({
      timeout: 30_000,
    });

    const main = page.getByRole("main");

    // expect: `main` 안에 버튼 `공유하기` 가 보인다.
    await expect(main.getByRole("button", { name: "공유하기" })).toBeVisible();

    // 2. `공유하기` 를 누르고 `window.__shareCalls.length` 가 1 이 되길 기다립니다.
    await main.getByRole("button", { name: "공유하기" }).click();
    await expect
      .poll(
        () =>
          page.evaluate(
            () => (window as unknown as ShareStubWindow).__shareCalls.length,
          ),
        { timeout: 5000 },
      )
      .toBe(1);

    // expect: 호출 인자가 `{ title, url }` 이고 url 이 소유자 공유 URL 이다.
    const calls = await page.evaluate(
      () => (window as unknown as ShareStubWindow).__shareCalls,
    );
    expect(calls[0].title).toBe("뭐갖고싶어 생일 위시리스트");
    const url = new URL(calls[0].url ?? "");
    expect(url.origin).toBe("http://localhost:3200");
    expect(url.pathname).toBe(`/wishlist/${admin.slug}`);
    expect(url.searchParams.get("utm_source")).toBe("owner_share");
    expect(url.searchParams.get("utm_medium")).toBe("share");

    // expect: `window.__clipWrites` 가 0 이다(클립보드 폴백이 일어나지 않음).
    expect(
      await page.evaluate(
        () => (window as unknown as ShareStubWindow).__clipWrites,
      ),
    ).toBe(0);

    // expect: 토스트가 0개이고 버튼 라벨이 `공유하기` 그대로이다.
    await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);
    await expect(main.getByRole("button", { name: "공유하기" })).toHaveText(
      "공유하기",
    );

    // expect: URL 은 `/admin` 그대로이다.
    expect(new URL(page.url()).pathname).toBe("/admin");
  });
});
