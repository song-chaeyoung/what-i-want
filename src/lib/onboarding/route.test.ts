import { beforeEach, describe, expect, test, vi } from "vitest";
import { POST } from "@/app/api/onboarding/route";

const { auth, repository } = vi.hoisted(() => ({
  auth: vi.fn(),
  repository: {
    hasCompletedOnboarding: vi.fn(),
    isWishlistSlugAvailable: vi.fn(),
    completeOnboarding: vi.fn(),
    deleteIncompleteUser: vi.fn(),
  },
}));

vi.mock("@/auth", () => ({ auth }));
vi.mock("./repository", () => ({
  DrizzleOnboardingRepository: class {
    hasCompletedOnboarding = repository.hasCompletedOnboarding;
    isWishlistSlugAvailable = repository.isWishlistSlugAvailable;
    completeOnboarding = repository.completeOnboarding;
    deleteIncompleteUser = repository.deleteIncompleteUser;
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ user: { id: "user-1" } });
  repository.hasCompletedOnboarding.mockResolvedValue(false);
  repository.isWishlistSlugAvailable.mockResolvedValue(true);
  repository.completeOnboarding.mockResolvedValue({ ok: true });
});

function onboardingRequest(displayName: string): Request {
  return new Request(
    "https://wishlist.example/api/onboarding?error=__proto__&error=unexpected",
    {
      method: "POST",
      body: new URLSearchParams({
        displayName,
        birthday: "",
        description: "  생일 소개  ",
        ageConfirmed: "on",
      }),
    },
  );
}

describe("onboarding route and service integration", () => {
  test.each([
    { displayName: "가".repeat(81), error: "display_name_too_long" },
    { displayName: "   ", error: "display_name_required" },
  ])("redirects $error without storing a profile", async ({ displayName, error }) => {
    const response = await POST(onboardingRequest(displayName));

    expect(response.headers.get("location")).toBe(
      `https://wishlist.example/onboarding?error=${error}`,
    );
    expect(repository.completeOnboarding).not.toHaveBeenCalled();
    expect(repository.deleteIncompleteUser).not.toHaveBeenCalled();
  });

  test("persists an 80-character name for the authenticated user", async () => {
    const displayName = "가".repeat(80);
    const response = await POST(onboardingRequest(`  ${displayName}  `));

    expect(response.headers.get("location")).toBe("https://wishlist.example/admin");
    expect(repository.completeOnboarding).toHaveBeenCalledTimes(1);
    expect(repository.completeOnboarding).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        displayName,
        birthday: null,
        description: "생일 소개",
      }),
    );
  });

  test("redirects to login before reading or storing unauthenticated input", async () => {
    auth.mockResolvedValue(null);
    const request = onboardingRequest("민지");
    const readForm = vi.spyOn(request, "formData");

    const response = await POST(request);

    expect(response.headers.get("location")).toBe("https://wishlist.example/login");
    expect(readForm).not.toHaveBeenCalled();
    expect(repository.hasCompletedOnboarding).not.toHaveBeenCalled();
    expect(repository.completeOnboarding).not.toHaveBeenCalled();
  });
});
