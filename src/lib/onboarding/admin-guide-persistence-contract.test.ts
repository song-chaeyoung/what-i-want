import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test, vi } from "vitest";
import type { Database } from "@/src/lib/db/client";
import { profiles, wishlists } from "@/src/lib/db/schema";
import {
  DrizzleOnboardingRepository,
  getOnboardingState,
} from "@/src/lib/onboarding/repository";

vi.mock("@/src/lib/db/client", () => ({
  db: {},
}));

const root = process.cwd();
const schemaPath = join(root, "src/lib/db/schema/service.ts");
const migrationPath = join(
  root,
  "src/lib/db/migrations/0008_admin_onboarding_guide.sql",
);

describe("admin guide persistence contract", () => {
  test("declares the account-level guide state", () => {
    const schema = readFileSync(schemaPath, "utf8");

    expect(schema).toContain(
      'onboardingGuideCompletedAt: timestamp("onboarding_guide_completed_at"',
    );
  });

  test("selects and maps the persisted guide state through the repository", async () => {
    const completedAt = new Date("2026-07-20T01:00:00.000Z");
    const select = vi.fn(() => ({
      from: vi.fn(() => ({
        leftJoin: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([
              {
                completedAt,
                guideCompletedAt: null,
                wishlistSlug: "w-a3f91c0e7b42d8aa",
                wishlistThemeId: "pixel_y2k",
              },
            ]),
          })),
        })),
      })),
    }));
    const database = { select } as unknown as Database;

    await expect(
      getOnboardingState("user-1", database),
    ).resolves.toEqual({
      isComplete: true,
      guideCompletedAt: null,
      wishlistSlug: "w-a3f91c0e7b42d8aa",
      wishlistThemeId: "pixel_y2k",
    });
    expect(select).toHaveBeenCalledWith({
      completedAt: profiles.onboardingCompletedAt,
      guideCompletedAt: profiles.onboardingGuideCompletedAt,
      wishlistSlug: wishlists.slug,
      wishlistThemeId: wishlists.themeId,
    });
  });

  test("writes guide completion timestamps through the injected database", async () => {
    const where = vi.fn().mockResolvedValue(undefined);
    const set = vi.fn(() => ({ where }));
    const update = vi.fn(() => ({ set }));
    const database = { update } as unknown as Database;
    const repository = new DrizzleOnboardingRepository(database);

    await repository.completeAdminGuide("user-1");

    expect(update).toHaveBeenCalledWith(profiles);
    expect(set).toHaveBeenCalledWith({
      onboardingGuideCompletedAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
    expect(where).toHaveBeenCalledOnce();
  });

  test("backfills existing onboarded profiles without changing new defaults", () => {
    expect(existsSync(migrationPath)).toBe(true);
    const migration = readFileSync(migrationPath, "utf8");

    expect(migration).toContain(
      'ADD COLUMN "onboarding_guide_completed_at" timestamp',
    );
    expect(migration).toContain(
      'SET "onboarding_guide_completed_at" = "onboarding_completed_at"',
    );
    expect(migration).toContain(
      'WHERE "onboarding_completed_at" IS NOT NULL',
    );
    expect(migration).not.toContain(
      '"onboarding_guide_completed_at" timestamp NOT NULL',
    );
  });
});
