import { beforeEach, describe, expect, test, vi } from "vitest";
import { POST } from "@/app/api/admin/account/withdraw/route";

const { auth, signOut, withdrawAccount, revalidatePublicWishlist } = vi.hoisted(
  () => ({
    auth: vi.fn(),
    signOut: vi.fn(),
    withdrawAccount: vi.fn(),
    revalidatePublicWishlist: vi.fn(),
  }),
);

vi.mock("@/auth", () => ({ auth, signOut }));
vi.mock("@/src/lib/account-withdrawal/service", () => ({ withdrawAccount }));
vi.mock("@/src/lib/account-withdrawal/repository", () => ({
  DrizzleAccountWithdrawalRepository: class {},
}));
vi.mock("@/src/lib/public-wishlist/cache", () => ({
  revalidatePublicWishlist,
}));

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ user: { id: "user-1" } });
  withdrawAccount.mockResolvedValue({
    ok: true,
    wishlistSlug: "birthday",
  });
});

function withdrawRequest(): Request {
  return new Request("https://wishlist.example/api/admin/account/withdraw", {
    method: "POST",
    body: new URLSearchParams({ _method: "delete" }),
  });
}

describe("account withdrawal route", () => {
  test("sends the withdrawn home when signOut fails after the account is deleted", async () => {
    signOut.mockRejectedValue(new Error("session adapter failed"));

    const response = await POST(withdrawRequest());
    const location = new URL(response.headers.get("location") ?? "");

    expect(withdrawAccount).toHaveBeenCalledWith("user-1", expect.any(Object));
    expect(response.status).toBe(307);
    expect(location.pathname).toBe("/");
    expect(location.search).toBe("?withdrawn=1");
  });

  test("rethrows the signOut redirect", async () => {
    const redirectError = Object.assign(new Error("NEXT_REDIRECT"), {
      digest: "NEXT_REDIRECT;replace;/?withdrawn=1;307;",
    });
    signOut.mockRejectedValue(redirectError);

    await expect(POST(withdrawRequest())).rejects.toBe(redirectError);
    expect(withdrawAccount).toHaveBeenCalledOnce();
  });
});
