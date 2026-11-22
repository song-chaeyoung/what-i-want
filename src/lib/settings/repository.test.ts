import { drizzle } from "drizzle-orm/pg-proxy";
import { describe, expect, test, vi } from "vitest";
import type { Database } from "@/src/lib/db/client";
import { DrizzleSettingsRepository } from "./repository";

vi.mock("@/src/lib/db/client", () => ({ db: undefined }));

describe("settings repository bank account delete", () => {
  test("deletes only the bank account row for the given owner", async () => {
    const execute = vi.fn(async () => ({ rows: [{ id: "account-1" }] }));
    const database = drizzle(execute);
    const repository = new DrizzleSettingsRepository(
      database as unknown as Database,
    );
    const ownerId = "c35ef518-5738-4804-a222-997b3462af3c";

    await expect(repository.deleteBankAccount(ownerId)).resolves.toBe(true);

    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledWith(
      'delete from "bank_accounts" where "bank_accounts"."user_id" = $1 returning "id"',
      [ownerId],
      "all",
      ["uuid"],
    );
  });

  test("reports that another owner's id deleted no row", async () => {
    const execute = vi.fn(async () => ({ rows: [] }));
    const database = drizzle(execute);
    const repository = new DrizzleSettingsRepository(
      database as unknown as Database,
    );

    await expect(
      repository.deleteBankAccount("6d9f1c2a-1b34-4e5f-9a70-2c1d8e0f4b11"),
    ).resolves.toBe(false);
  });
});
