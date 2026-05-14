import { eq } from "drizzle-orm";
import type {
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

  async completeOnboarding(record: CompleteOnboardingRecord): Promise<void> {
    const now = new Date();

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
  }
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
