import { describe, expect, test, vi } from "vitest";
import { unlinkKakaoUser } from "@/src/lib/kakao/unlink";
import type { DeletedAccount } from "./repository";
import {
  withdrawAccount,
  type AccountWithdrawalRepository,
} from "./service";

class FakeWithdrawalRepository implements AccountWithdrawalRepository {
  deletedUserIds: string[] = [];
  kakaoProviderAccountIds = new Map<string, string>();

  constructor(readonly accounts: Map<string, DeletedAccount>) {}

  async findKakaoProviderAccountId(userId: string): Promise<string | null> {
    return this.kakaoProviderAccountIds.get(userId) ?? null;
  }

  async deleteAccount(userId: string): Promise<DeletedAccount | null> {
    this.deletedUserIds.push(userId);
    const account = this.accounts.get(userId);

    if (!account) {
      return null;
    }

    this.accounts.delete(userId);
    return account;
  }
}

describe("account withdrawal service", () => {
  test("deletes only the requested user and returns the public slug", async () => {
    const repository = new FakeWithdrawalRepository(
      new Map([
        ["user-1", { wishlistSlug: "birthday" }],
        ["user-2", { wishlistSlug: "other-birthday" }],
      ]),
    );

    await expect(withdrawAccount("user-1", repository)).resolves.toEqual({
      ok: true,
      wishlistSlug: "birthday",
    });
    expect(repository.deletedUserIds).toEqual(["user-1"]);
    expect(repository.accounts.has("user-2")).toBe(true);

    await expect(withdrawAccount("user-1", repository)).resolves.toEqual({
      ok: false,
      error: "account_not_found",
    });
    await expect(withdrawAccount("missing-user", repository)).resolves.toEqual({
      ok: false,
      error: "account_not_found",
    });
    expect(repository.accounts.get("user-2")).toEqual({
      wishlistSlug: "other-birthday",
    });
  });

  test("does not delete a Kakao user when unlinking fails", async () => {
    const repository = new FakeWithdrawalRepository(
      new Map([["user-1", { wishlistSlug: "birthday" }]]),
    );
    repository.kakaoProviderAccountIds.set("user-1", "555");
    const unlink = vi.fn(async () => ({
      ok: false as const,
      reason: "http_error" as const,
    }));

    await expect(
      withdrawAccount("user-1", repository, { unlinkKakaoUser: unlink }),
    ).resolves.toEqual({ ok: false, error: "kakao_unlink_failed" });
    expect(unlink).toHaveBeenCalledWith("555");
    expect(repository.deletedUserIds).toEqual([]);
  });

  test("deletes a Kakao user after unlinking succeeds", async () => {
    const repository = new FakeWithdrawalRepository(
      new Map([["user-1", { wishlistSlug: "birthday" }]]),
    );
    repository.kakaoProviderAccountIds.set("user-1", "555");
    const events: string[] = [];
    const unlink = vi.fn(async () => {
      events.push("unlink");
      return { ok: true as const };
    });
    const originalDelete = repository.deleteAccount.bind(repository);
    repository.deleteAccount = async (userId) => {
      events.push("delete");
      return originalDelete(userId);
    };

    await expect(
      withdrawAccount("user-1", repository, { unlinkKakaoUser: unlink }),
    ).resolves.toEqual({ ok: true, wishlistSlug: "birthday" });
    expect(events).toEqual(["unlink", "delete"]);
  });

  test("deletes a Kakao user when Kakao says the app is not linked", async () => {
    const repository = new FakeWithdrawalRepository(
      new Map([["user-1", { wishlistSlug: "birthday" }]]),
    );
    repository.kakaoProviderAccountIds.set("user-1", "555");
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ code: -101 }), { status: 400 }),
    );

    await expect(
      withdrawAccount("user-1", repository, {
        unlinkKakaoUser: (kakaoUserId) =>
          unlinkKakaoUser(kakaoUserId, {
            fetch: fetchImpl,
            adminKey: "test-admin-key",
          }),
      }),
    ).resolves.toEqual({ ok: true, wishlistSlug: "birthday" });
    expect(repository.deletedUserIds).toEqual(["user-1"]);
  });

  test("does not call Kakao for a Google-only user", async () => {
    const repository = new FakeWithdrawalRepository(
      new Map([["user-1", { wishlistSlug: "birthday" }]]),
    );
    const unlink = vi.fn(async () => ({ ok: true as const }));

    await expect(
      withdrawAccount("user-1", repository, { unlinkKakaoUser: unlink }),
    ).resolves.toEqual({ ok: true, wishlistSlug: "birthday" });
    expect(unlink).not.toHaveBeenCalled();
    expect(repository.deletedUserIds).toEqual(["user-1"]);
  });
});
