import { eq } from "drizzle-orm";
import type {
  CompleteOnboardingPersistResult,
  CompleteOnboardingRecord,
  OnboardingRepository,
  OnboardingState,
} from "./types";
import { db, type Database } from "@/src/lib/db/client";
import { profiles, wishlists } from "@/src/lib/db/schema";

export class DrizzleOnboardingRepository implements OnboardingRepository {
  constructor(private readonly database: Database = db) {}

  async hasCompletedOnboarding(userId: string): Promise<boolean> {
    const [profile] = await this.database
      .select({ completedAt: profiles.onboardingCompletedAt })
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    return Boolean(profile?.completedAt);
  }

  async isWishlistSlugAvailable(slug: string): Promise<boolean> {
    const [wishlist] = await this.database
      .select({ id: wishlists.id })
      .from(wishlists)
      .where(eq(wishlists.slug, slug))
      .limit(1);

    return !wishlist;
  }

  async completeOnboarding(
    record: CompleteOnboardingRecord,
  ): Promise<CompleteOnboardingPersistResult> {
    const now = new Date();

    try {
      await this.database.transaction(async (tx) => {
        await tx
          .insert(profiles)
          .values({
            userId: record.userId,
            displayName: record.displayName,
            birthday: record.birthday,
            description: record.description,
            onboardingCompletedAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: profiles.userId,
            set: {
              displayName: record.displayName,
              birthday: record.birthday,
              description: record.description,
              onboardingCompletedAt: now,
              updatedAt: now,
            },
          });

        await tx.insert(wishlists).values({
          ownerId: record.userId,
          slug: record.wishlistSlug,
          title: record.wishlistTitle,
          themeId: record.wishlistThemeId,
          visibility: record.wishlistVisibility,
          updatedAt: now,
        });
      });
    } catch (error) {
      const constraint = findUniqueViolationConstraint(error);

      if (constraint === null) {
        throw error;
      }

      return {
        ok: false,
        error: constraint.includes("slug") ? "duplicate_slug" : "already_completed",
      };
    }

    return { ok: true };
  }
}

// Concurrent onboarding submissions can both pass the availability checks;
// the unique constraints on wishlists.slug and wishlists.owner_id are the
// final arbiter, so translate their violations into domain errors.
function findUniqueViolationConstraint(error: unknown): string | null {
  let current: unknown = error;

  while (current instanceof Error) {
    const candidate = current as { code?: unknown; constraint_name?: unknown };

    if (candidate.code === "23505") {
      return typeof candidate.constraint_name === "string"
        ? candidate.constraint_name
        : "";
    }

    current = current.cause;
  }

  return null;
}

export async function getOnboardingState(
  userId: string,
  database: Database = db,
): Promise<OnboardingState> {
  const [state] = await database
    .select({
      completedAt: profiles.onboardingCompletedAt,
      wishlistSlug: wishlists.slug,
    })
    .from(profiles)
    .leftJoin(wishlists, eq(wishlists.ownerId, profiles.userId))
    .where(eq(profiles.userId, userId))
    .limit(1);

  return {
    isComplete: Boolean(state?.completedAt),
    wishlistSlug: state?.wishlistSlug ?? null,
  };
}
