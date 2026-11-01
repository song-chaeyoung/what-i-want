import { mkdir, readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { expect, test, type Browser } from "@playwright/test";
import {
  ADMIN_GUIDE_STORAGE_KEY,
  ADMIN_USER_ID,
  BASE_URL,
  COOKIE_NAME,
  SCREENSHOT_DIR,
  SCREENSHOT_FIXED_AT,
  SCREENSHOT_KST_DATE,
  SESSION_BY_NAME,
  buildShots,
  type SessionName,
  type Shot,
} from "./fixtures";

const shots = buildShots();
const screenshotDirectory = path.join(process.cwd(), SCREENSHOT_DIR);

// workers: 1 이라 파일 안 테스트는 등록 순서대로 돈다.
// serial 로 묶으면 한 건 실패 때 나머지를 건너뛰어 관리자 읽음 순서만 남기고 이미지가 비게 된다.

const CAPTURE_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    scroll-behavior: auto !important;
  }
  html, body { scrollbar-width: none !important; }
  ::-webkit-scrollbar { width: 0 !important; height: 0 !important; display: none !important; }
  .sticky { position: static !important; }
  nextjs-portal,
  script[data-nextjs-dev-overlay],
  #next-logo,
  [data-nextjs-dev-tools-button],
  [data-issues],
  [data-nextjs-dialog],
  [data-nextjs-dialog-overlay] {
    display: none !important;
  }
`;

test.beforeAll(async () => {
  await mkdir(screenshotDirectory, { recursive: true });
  const entries = await readdir(screenshotDirectory);

  await Promise.all(
    entries
      .filter((name) => name.endsWith(".png"))
      .map((name) => unlink(path.join(screenshotDirectory, name))),
  );
});

for (const shot of shots) {
  test(shot.file, async ({ browser }) => {
    await captureShot(browser, shot);
  });
}

async function captureShot(browser: Browser, shot: Shot): Promise<void> {
  const markGuideSeen = usesAdminShell(shot.session) && !shot.openGuide;
  const confettiKey =
    shot.session === "admin"
      ? `birthday-confetti-${ADMIN_USER_ID}-${SCREENSHOT_KST_DATE}`
      : null;
  const localStorage = [
    ...(markGuideSeen
      ? [{ name: ADMIN_GUIDE_STORAGE_KEY, value: "1" }]
      : []),
    ...(confettiKey ? [{ name: confettiKey, value: "1" }] : []),
  ];
  const context = await browser.newContext({
    viewport: {
      width: shot.width,
      height: shot.width === 375 ? 812 : 800,
    },
    deviceScaleFactor: 1,
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    colorScheme: "light",
    reducedMotion: "reduce",
    storageState: {
      cookies:
        shot.session === "none"
          ? []
          : [
              {
                name: COOKIE_NAME,
                value: SESSION_BY_NAME[shot.session],
                domain: "localhost",
                path: "/",
                httpOnly: true,
                secure: false,
                sameSite: "Lax",
                expires: 4102444800,
              },
            ],
      origins: localStorage.length
        ? [{ origin: BASE_URL, localStorage }]
        : [],
    },
  });
  const page = await context.newPage();

  try {
    // setFixedTime 은 Date 를 고정 시각에 붙잡아 두고, 타이머는 흐르게 둔다.
    // install() 만 쓰면 촬영이 길어질수록 가짜 시각이 같이 흐른다.
    await page.clock.setFixedTime(new Date(SCREENSHOT_FIXED_AT));
    // 문서가 생기기 전에 돌 수 있어 DOM 은 건드리지 않는다.
    // storageState 가 오리진과 어긋나도 가이드/콘페티 플래그는 여기 남는다.
    await page.addInitScript(installCaptureStorage, {
      markGuideSeen,
      guideKey: ADMIN_GUIDE_STORAGE_KEY,
      confettiKey,
    });
    await page.goto(shot.path, { waitUntil: "load" });
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    await expect(page.getByText(shot.readyText).first()).toBeVisible();

    if (shot.alsoText) {
      await expect(page.getByText(shot.alsoText).first()).toBeVisible();
    }

    if (shot.dataTheme) {
      await expect(page.locator("main").first()).toHaveAttribute(
        "data-theme",
        shot.dataTheme,
      );
    }

    if (shot.fieldValue) {
      await expect(page.locator(shot.fieldValue.selector)).toHaveValue(
        shot.fieldValue.value,
      );
    }

    if (shot.openGuide) {
      await expect(page.getByRole("dialog")).toBeVisible();
    } else if (usesAdminShell(shot.session)) {
      await expect(page.getByRole("dialog")).toHaveCount(0);
    }

    const current = new URL(page.url());
    expect(`${current.pathname}${current.search}`).toBe(shot.path);
    expect(current.origin).toBe(BASE_URL);

    // 하이드레이션 전에 style 을 넣으면 React 가 지우고, 개발 오버레이 이슈로 남는다.
    const devToolsLeaked = await page.evaluate(applyCaptureChrome, CAPTURE_CSS);
    expect(devToolsLeaked).toBe(false);

    const filePath = path.join(screenshotDirectory, shot.file);
    await page.screenshot({
      path: filePath,
      fullPage: true,
      animations: "disabled",
      caret: "hide",
      scale: "css",
    });
    const file = await stat(filePath);
    expect(file.size).toBeGreaterThan(1_000);
  } finally {
    await context.close();
  }
}

function usesAdminShell(session: Shot["session"]): session is SessionName {
  return session === "admin" || session === "empty" || session === "quiet";
}

function installCaptureStorage({
  markGuideSeen,
  guideKey,
  confettiKey,
}: {
  markGuideSeen: boolean;
  guideKey: string;
  confettiKey: string | null;
}): void {
  if (markGuideSeen) {
    window.localStorage.setItem(guideKey, "1");
  }

  if (confettiKey) {
    window.localStorage.setItem(confettiKey, "1");
  }
}

function applyCaptureChrome(css: string): boolean {
  const devToolsSelector = [
    "nextjs-portal",
    "script[data-nextjs-dev-overlay]",
    "#next-logo",
    "[data-nextjs-dev-tools-button]",
    "[data-issues]",
    "[data-nextjs-dialog]",
    "[data-nextjs-dialog-overlay]",
  ].join(", ");
  const style =
    document.getElementById("screenshot-capture-style") ??
    document.createElement("style");
  style.id = "screenshot-capture-style";
  style.textContent = css;
  (document.head ?? document.documentElement).append(style);

  const hideTree = (root: ParentNode) => {
    for (const element of root.querySelectorAll(devToolsSelector)) {
      if (element instanceof HTMLElement) {
        element.style.setProperty("display", "none", "important");
      }
    }

    for (const element of root.querySelectorAll("*")) {
      if (element instanceof HTMLElement && element.shadowRoot) {
        hideTree(element.shadowRoot);
      }
    }
  };

  hideTree(document);

  const painted = (element: Element) => {
    if (!(element instanceof HTMLElement)) {
      return false;
    }

    const computed = getComputedStyle(element);

    if (computed.display === "none" || computed.visibility === "hidden") {
      return false;
    }

    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  };

  const leaked = (root: ParentNode): boolean => {
    for (const element of root.querySelectorAll(
      "#next-logo, [data-nextjs-dev-tools-button], nextjs-portal",
    )) {
      if (painted(element)) {
        return true;
      }
    }

    for (const element of root.querySelectorAll("*")) {
      if (
        element instanceof HTMLElement &&
        element.shadowRoot &&
        leaked(element.shadowRoot)
      ) {
        return true;
      }
    }

    return false;
  };

  return leaked(document);
}
