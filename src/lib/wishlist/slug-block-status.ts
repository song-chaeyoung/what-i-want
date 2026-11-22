import { and, eq, gt } from "drizzle-orm";
import { db, type Database } from "@/src/lib/db/client";
import { withdrawnSlugBlocks } from "@/src/lib/db/schema";
import { getSlugBlockSecret, hashWithdrawnSlug } from "./slug-block";

export async function isWithdrawnSlugBlocked(
  slug: string,
  options: { now?: Date; database?: Database } = {},
): Promise<boolean> {
  const secret = getSlugBlockSecret();

  if (!secret) {
    throw new Error(
      "SLUG_BLOCK_SECRET or AUTH_SECRET is required to check a withdrawn wishlist slug.",
    );
  }

  const now = options.now ?? new Date();
  const database = options.database ?? db;
  const slugHash = hashWithdrawnSlug(slug, secret);
  const [block] = await database
    .select({ slugHash: withdrawnSlugBlocks.slugHash })
    .from(withdrawnSlugBlocks)
    .where(
      and(
        eq(withdrawnSlugBlocks.slugHash, slugHash),
        gt(withdrawnSlugBlocks.blockedUntil, now),
      ),
    )
    .limit(1);

  return Boolean(block);
}
