import { getTableConfig, PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, test } from "vitest";
import { wishItems } from "./service";

describe("wish items schema", () => {
  test("requires target amounts to be at least one", () => {
    const check = getTableConfig(wishItems).checks.find(
      ({ name }) => name === "wish_items_target_amount_min",
    );

    expect(check).toBeDefined();
    expect(new PgDialect().sqlToQuery(check!.value)).toMatchObject({
      sql: '"wish_items"."target_amount" >= 1',
      params: [],
    });
  });
});
