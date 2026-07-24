import { describe, expect, test, vi } from "vitest";
import { requestAdminGuideCompletion } from "@/app/admin/admin-guide-request";

describe("admin guide completion request", () => {
  test("maps a successful response", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));

    await expect(requestAdminGuideCompletion(fetcher)).resolves.toBe("ok");
    expect(fetcher).toHaveBeenCalledWith(
      "/api/admin/onboarding-guide/complete",
      { method: "POST" },
    );
  });

  test("distinguishes an expired session", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 401 }));

    await expect(requestAdminGuideCompletion(fetcher)).resolves.toBe(
      "unauthorized",
    );
  });

  test.each([409, 500])("maps HTTP %s to a retryable error", async (status) => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response(null, { status }));

    await expect(requestAdminGuideCompletion(fetcher)).resolves.toBe("error");
  });

  test("maps a network rejection to a retryable error", async () => {
    const fetcher = vi.fn().mockRejectedValue(new TypeError("offline"));

    await expect(requestAdminGuideCompletion(fetcher)).resolves.toBe("error");
  });
});
