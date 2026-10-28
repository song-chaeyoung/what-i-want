import { drizzle } from "drizzle-orm/pg-proxy";
import { describe, expect, test, vi } from "vitest";
import type { Database } from "@/src/lib/db/client";
import { DrizzleAdminMessagesRepository } from "./repository";

vi.mock("@/src/lib/db/client", () => ({ db: undefined }));

describe("admin messages repository", () => {
  test("atomically keeps the latest read timestamp even when requests finish out of order", async () => {
    const execute = vi.fn(async () => ({ rows: [] }));
    const database = drizzle(execute);
    const repository = new DrizzleAdminMessagesRepository(
      database as unknown as Database,
    );
    const wishlistId = "c35ef518-5738-4804-a222-997b3462af3c";
    const readTimes = [
      new Date("2026-10-28T01:02:00.000Z"),
      new Date("2026-10-28T01:01:00.000Z"),
    ];

    for (const readAt of readTimes) {
      await repository.markMessagesRead(wishlistId, readAt);
    }

    expect(execute).toHaveBeenCalledTimes(2);

    for (const [index, readAt] of readTimes.entries()) {
      expect(execute).toHaveBeenNthCalledWith(
        index + 1,
        'update "wishlists" set "messages_read_at" = GREATEST("wishlists"."messages_read_at", $1) where "wishlists"."id" = $2',
        [readAt.toISOString(), wishlistId],
        "execute",
        ["timestamp", "uuid"],
      );
    }
  });
});
