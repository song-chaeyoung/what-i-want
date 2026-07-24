import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";

const routeMocks = vi.hoisted(() => ({
  auth: vi.fn(),
  completeAdminGuide: vi.fn(),
  constructRepository: vi.fn(),
  repository: { kind: "onboarding-repository" },
}));

vi.mock("@/auth", () => ({
  auth: routeMocks.auth,
}));

vi.mock("@/src/lib/onboarding/repository", () => ({
  DrizzleOnboardingRepository: function DrizzleOnboardingRepositoryMock() {
    routeMocks.constructRepository();
    return routeMocks.repository;
  },
}));

vi.mock("@/src/lib/onboarding/service", () => ({
  completeAdminGuide: routeMocks.completeAdminGuide,
}));

import { POST } from "@/app/api/admin/onboarding-guide/complete/route";

describe("POST /api/admin/onboarding-guide/complete", () => {
  beforeEach(() => {
    routeMocks.auth.mockReset();
    routeMocks.completeAdminGuide.mockReset();
    routeMocks.constructRepository.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("returns 200 after completing the authenticated user's guide", async () => {
    routeMocks.auth.mockResolvedValue({
      user: { id: "user-1" },
    });
    routeMocks.completeAdminGuide.mockResolvedValue({ ok: true });

    const response = await POST();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(routeMocks.constructRepository).toHaveBeenCalledOnce();
    expect(routeMocks.completeAdminGuide).toHaveBeenCalledWith(
      "user-1",
      routeMocks.repository,
    );
  });

  test("returns 401 without calling the service when authentication is missing", async () => {
    routeMocks.auth.mockResolvedValue(null);

    const response = await POST();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "unauthorized",
    });
    expect(routeMocks.constructRepository).not.toHaveBeenCalled();
    expect(routeMocks.completeAdminGuide).not.toHaveBeenCalled();
  });

  test("returns 409 when the domain rejects guide completion", async () => {
    routeMocks.auth.mockResolvedValue({
      user: { id: "user-1" },
    });
    routeMocks.completeAdminGuide.mockResolvedValue({
      ok: false,
      error: "onboarding_incomplete",
    });

    const response = await POST();

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "onboarding_incomplete",
    });
  });

  test("returns 500 when guide completion throws unexpectedly", async () => {
    const failure = new Error("database unavailable");
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    routeMocks.auth.mockResolvedValue({
      user: { id: "user-1" },
    });
    routeMocks.completeAdminGuide.mockRejectedValue(failure);

    const response = await POST();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "unexpected",
    });
    expect(consoleError).toHaveBeenCalledWith(failure);
  });
});
