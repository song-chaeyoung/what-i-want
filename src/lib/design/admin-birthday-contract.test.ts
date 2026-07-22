import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const root = process.cwd();
const confettiPath = join(root, "app/admin/birthday-confetti.tsx");
const globalsCssPath = join(root, "app/globals.css");

describe("admin birthday celebration contract", () => {
  test("keeps confetti client-only, account-scoped, and Strict Mode safe", () => {
    const source = readFileSync(confettiPath, "utf8");

    expect(source.startsWith('"use client";')).toBe(true);
    expect(source).toContain("useEffect");
    expect(source).toContain("useRef");
    expect(source).toContain("startedKeyRef.current !== storageKey");
    expect(source).toContain(
      "`birthday-confetti-${userId}-${dateKey}`",
    );
    expect(source).toContain("window.localStorage.getItem");
    expect(source).toContain("window.localStorage.setItem");
    expect(source).toContain("window.setTimeout");
    expect(source).toContain("window.clearTimeout");
    expect(source.indexOf("window.localStorage.setItem")).toBeLessThan(
      source.indexOf("setCelebration("),
    );

    const startedKeyGuardIndex = source.indexOf(
      "if (startedKeyRef.current !== storageKey)",
    );
    const timerAfterGuardIndex = source.indexOf(
      "\n    }\n\n    const timeoutId = window.setTimeout",
      startedKeyGuardIndex,
    );

    expect(source).toContain("type ConfettiState =");
    expect(source).toContain(
      "const [celebration, setCelebration] = useState<ConfettiState>(null);",
    );
    expect(source).toContain(
      "celebration === null || celebration.storageKey !== storageKey",
    );
    expect(source).toContain("celebration.pieces.map");
    expect(source).not.toContain("react-hooks/refs");
    expect(timerAfterGuardIndex).toBeGreaterThan(startedKeyGuardIndex);
    expect(source).toContain("}, [storageKey]);");
  });

  test("keeps confetti decorative, clipped, and motion-safe", () => {
    const source = readFileSync(confettiPath, "utf8");

    expect(source).toContain('aria-hidden="true"');
    expect(source).toContain("pointer-events-none");
    expect(source).toContain("overflow-hidden");
    expect(source).toContain("motion-reduce:hidden");
    expect(source).toContain('"--drift"');
    expect(source).toContain('"--drift-reverse"');
  });

  test("defines and connects a namespaced swaying fall animation", () => {
    const source = readFileSync(confettiPath, "utf8");
    const css = readFileSync(globalsCssPath, "utf8");

    expect(source).toContain("admin-birthday-confetti-piece");
    expect(css).toContain(".admin-birthday-confetti-piece");
    expect(css).toContain("@keyframes admin-birthday-confetti-fall");
    expect(css).toContain(
      "animation-name: admin-birthday-confetti-fall;",
    );
    expect(css).toContain("animation-fill-mode: both;");
    expect(css).toContain("25%");
    expect(css).toContain("50%");
    expect(css).toContain("75%");
  });

  test("renders the server birthday greeting only on the admin dashboard", () => {
    const adminPagePath = join(root, "app/admin/page.tsx");
    const adminPage = readFileSync(adminPagePath, "utf8");
    const otherAdminPages = [
      "app/admin/wishes/page.tsx",
      "app/admin/messages/page.tsx",
      "app/admin/settings/page.tsx",
    ].map((path) => readFileSync(join(root, path), "utf8"));

    expect(adminPage).toContain(
      'import { getProfileGreeting } from "@/src/lib/profile/repository";',
    );
    expect(adminPage).toContain("getDaysUntilBirthday");
    expect(adminPage).toContain("getKstDateKey");
    expect(adminPage).toContain(
      'import { BirthdayConfetti } from "./birthday-confetti";',
    );
    expect(adminPage).toMatch(
      /Promise\.all\(\[[\s\S]*getProfileGreeting\(user\.id\)[\s\S]*\]\)/,
    );
    expect(adminPage).toContain("const now = new Date();");
    expect(adminPage).toContain("profileGreeting?.birthday");
    expect(adminPage).toContain(
      "getDaysUntilBirthday(profileGreeting.birthday, now) === 0",
    );
    expect(adminPage).toContain("getKstDateKey(now)");
    expect(adminPage).toContain(
      "생일 축하해요, {profileGreeting.displayName}님! 🎉",
    );
    expect(adminPage.indexOf("<BirthdayConfetti")).toBeLessThan(
      adminPage.indexOf("<AdminMetricGroup"),
    );

    for (const source of otherAdminPages) {
      expect(source).not.toContain("BirthdayConfetti");
      expect(source).not.toContain("생일 축하해요");
    }
  });
});
