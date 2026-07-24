import { getTableColumns } from "drizzle-orm";
import { getTableConfig, PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, test } from "vitest";
import { profiles, wishItems } from "./service";

describe("profiles schema", () => {
  test("stores the admin guide completion timestamp", () => {
    const columns = getTableColumns(profiles);

    expect(columns.onboardingGuideCompletedAt.name).toBe(
      "onboarding_guide_completed_at",
    );
    expect(columns.onboardingGuideCompletedAt.notNull).toBe(false);
  });
});

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
