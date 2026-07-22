import { eq } from "drizzle-orm";
import { db, type Database } from "@/src/lib/db/client";
import { profiles } from "@/src/lib/db/schema";

export type ProfileGreeting = {
  displayName: string;
  birthday: string | null;
};

export async function getProfileGreeting(
  userId: string,
  database: Database = db,
): Promise<ProfileGreeting | null> {
  const [row] = await database
    .select({
      displayName: profiles.displayName,
      birthday: profiles.birthday,
    })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  return row ?? null;
}
