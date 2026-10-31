// spec: specs/sample-wishlist.md
// seed: tests/seed.spec.ts

import { test, expect } from "@playwright/test";
import type { BrowserContext, Page } from "@playwright/test";

const SHARE_URL =
  "http://localhost:3200/sample?theme=pixel_y2k&utm_source=visitor_share&utm_medium=share";

type ShareOutcome = "resolve" | "AbortError" | "NotAllowedError";

// 스텁이 기록하는 window 전역값의 타입 (any 대신 명시적 캐스트에 사용)
type ShareStubWindow = Window & {
  __shareCalls: ShareData[];
  __clipboardWrites: string[];
};

// 하위 케이스마다 새 페이지를 만들고, 페이지 스크립트가 실행되기 전에 스텁을 주입한다.
// addInitScript 는 해당 페이지에만 적용되므로 케이스 간에 스텁이 새지 않는다.
async function openSamplePage(
  context: BrowserContext,
  outcome: ShareOutcome,
): Promise<Page> {
  const page = await context.newPage();
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

    // 클립보드 폴백 호출 여부를 기록한다 (실제 복사는 그대로 수행).
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

  await page.goto("/sample");
  await expect(
    page.getByRole("heading", { level: 1, name: "민지님의 위시리스트" }),
  ).toBeVisible({ timeout: 30_000 });
  return page;
}

test.describe("Share", () => {
  test.use({ permissions: ["clipboard-read", "clipboard-write"] });

  test("Native Share Paths", async ({ context }) => {
    // 1. [하위 케이스 A: 공유 성공] 새 페이지에서 `addInitScript` 로 `navigator.share` 를
    //    `window.__shareCalls` 에 인자를 기록하고 `Promise.resolve()` 를 반환하는 함수로 교체한 뒤
    //    `/sample` 로 이동하고 헤더의 `공유하기` 를 클릭합니다.
    await test.step("A: 공유 성공", async () => {
      const page = await openSamplePage(context, "resolve");
      const header = page.locator("header");
      // 헤더에는 버튼이 하나뿐이며, 복사 후 라벨이 바뀔 수 있으므로 이름 없이 찾는다.
      const shareButton = header.getByRole("button");

      await header.getByRole("button", { name: "공유하기" }).click();

      // expect: `navigator.share` 가 정확히 1번 호출되고 인자가
      // `{ title: '민지님의 위시리스트', url: 'http://localhost:3200/sample?theme=pixel_y2k&utm_source=visitor_share&utm_medium=share' }` 이다.
      await expect
        .poll(() =>
          page.evaluate(() => (window as unknown as ShareStubWindow).__shareCalls),
        )
        .toEqual([{ title: "민지님의 위시리스트", url: SHARE_URL }]);

      // expect: 토스트 `위시리스트 링크를 복사했어요.` 가 나타나지 않는다.
      // (share 호출이 기록된 시점에는 폴백이 있었다면 이미 clipboard.writeText 를 호출했어야 한다.)
      expect(
        await page.evaluate(
          () => (window as unknown as ShareStubWindow).__clipboardWrites,
        ),
      ).toEqual([]);
      await expect(
        page.getByText("위시리스트 링크를 복사했어요.", { exact: true }),
      ).toHaveCount(0);
      await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);

      // expect: 버튼 라벨은 `공유하기` 그대로이다 (`복사 완료` 로 바뀌지 않음).
      await expect(shareButton).toHaveText("공유하기");

      await page.close();
    });

    // 2. [하위 케이스 B: 사용자가 공유 시트를 닫음] 새 페이지에서 `navigator.share` 가
    //    `new DOMException('x', 'AbortError')` 로 reject 되도록 스텁하고 `/sample` 에서 `공유하기` 를 클릭합니다.
    await test.step("B: 사용자가 공유 시트를 닫음 (AbortError)", async () => {
      const page = await openSamplePage(context, "AbortError");
      const header = page.locator("header");
      const shareButton = header.getByRole("button");

      await header.getByRole("button", { name: "공유하기" }).click();

      // share 가 호출되어 reject 된 뒤의 상태를 검증한다.
      await expect
        .poll(() =>
          page.evaluate(
            () => (window as unknown as ShareStubWindow).__shareCalls.length,
          ),
        )
        .toBe(1);

      // expect: 토스트가 전혀 나타나지 않는다 (성공/실패 토스트 모두 없음).
      await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);
      await expect(
        page.getByText("위시리스트 링크를 복사했어요.", { exact: true }),
      ).toHaveCount(0);
      await expect(
        page.getByText("링크 복사에 실패했어요. 주소를 직접 복사해주세요.", {
          exact: true,
        }),
      ).toHaveCount(0);

      // expect: 버튼 라벨은 `공유하기` 그대로이다 (클립보드 폴백이 실행되지 않음).
      await expect(shareButton).toHaveText("공유하기");
      expect(
        await page.evaluate(
          () => (window as unknown as ShareStubWindow).__clipboardWrites,
        ),
      ).toEqual([]);

      await page.close();
    });

    // 3. [하위 케이스 C: 공유 실패 후 폴백] `clipboard-read`, `clipboard-write` 권한을 부여하고(위 `test.use({ permissions })`)
    //    `navigator.share` 가 `new DOMException('x', 'NotAllowedError')` 로 reject 되도록 스텁한 뒤
    //    `/sample` 에서 `공유하기` 를 클릭합니다.
    await test.step("C: 공유 실패 후 클립보드 폴백 (NotAllowedError)", async () => {
      const page = await openSamplePage(context, "NotAllowedError");
      const header = page.locator("header");
      const shareButton = header.getByRole("button");

      await header.getByRole("button", { name: "공유하기" }).click();

      // expect: 클립보드 복사 폴백이 실행되어 버튼 라벨이 `복사 완료` 로 바뀐다.
      await expect(shareButton).toHaveText("복사 완료");

      // expect: 토스트 `위시리스트 링크를 복사했어요.` 가 표시된다.
      await expect(
        page.getByText("위시리스트 링크를 복사했어요.", { exact: true }),
      ).toBeVisible();

      // expect: 클립보드 문자열이 `http://localhost:3200/sample?theme=pixel_y2k&utm_source=visitor_share&utm_medium=share` 이다.
      await expect
        .poll(() => page.evaluate(() => navigator.clipboard.readText()))
        .toBe(SHARE_URL);

      await page.close();
    });
  });
});
