import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test, vi } from "vitest";
import OnboardingPage from "@/app/onboarding/page";

vi.mock("@/src/lib/auth/require-user", () => ({
  requireUser: async () => ({ id: "user-1", name: "민지" }),
}));

vi.mock("@/src/lib/onboarding/repository", () => ({
  getOnboardingState: async () => ({ isComplete: false }),
}));

vi.mock("@/components/text-logo", () => ({ TextLogo: () => null }));
vi.mock("@/app/onboarding/birthday-picker", () => ({
  BirthdayPicker: () => null,
}));

async function renderOnboarding(error?: string): Promise<string> {
  return renderToStaticMarkup(
    await OnboardingPage({ searchParams: Promise.resolve({ error }) }),
  );
}

describe("onboarding page validation", () => {
  test("limits the display-name input to 80 characters", async () => {
    const html = await renderOnboarding();
    const input = html.match(/<input[^>]*name="displayName"[^>]*>/)?.[0];

    expect(input).toContain('maxLength="80"');
  });

  test("explains an overlong display name", async () => {
    expect(await renderOnboarding("display_name_too_long")).toContain(
      "표시 이름은 80자 이내로 입력해주세요.",
    );
  });

  test("renders a known validation error", async () => {
    expect(await renderOnboarding("display_name_required")).toContain(
      "표시 이름을 입력해주세요.",
    );
  });

  test.each(["__proto__", "constructor", "unknown_error"])(
    "renders safely for the unrecognized error query %s",
    async (error) => {
      await expect(renderOnboarding(error)).resolves.toContain(
        'action="/api/onboarding"',
      );
    },
  );
});
