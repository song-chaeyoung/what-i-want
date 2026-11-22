import { describe, expect, test } from "vitest";
import type { DeletedAccount } from "./repository";
import {
  withdrawAccount,
  type AccountWithdrawalRepository,
} from "./service";

class FakeWithdrawalRepository implements AccountWithdrawalRepository {
  deletedUserIds: string[] = [];

  constructor(readonly accounts: Map<string, DeletedAccount>) {}

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
});
