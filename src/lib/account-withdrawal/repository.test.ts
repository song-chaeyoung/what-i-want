import { randomUUID } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";
import type { Database } from "@/src/lib/db/client";
import * as schema from "@/src/lib/db/schema";
import {
  accounts,
  authenticators,
  bankAccounts,
  fundingLogs,
  messages,
  profiles,
  sessions,
  users,
  verificationTokens,
  wishItems,
  wishlists,
} from "@/src/lib/db/schema";
import { DrizzleAccountWithdrawalRepository } from "./repository";

vi.mock("@/src/lib/db/client", () => ({ db: undefined }));

const unitDatabaseUrl = "postgres://localhost:5432/mwagotgo_unit?TimeZone=UTC";

describe("account withdrawal repository", () => {
  const root = postgres("postgres://localhost:5432/postgres", {
    onnotice: () => {},
    max: 1,
  });
  let sql: ReturnType<typeof postgres> | undefined;
  let database: Database | undefined;
  const createdUserIds: string[] = [];
  const createdVerificationTokens: string[] = [];

  beforeAll(async () => {
    const existing = await root<{ datname: string }[]>`
      select datname from pg_database where datname = 'mwagotgo_unit'
    `;

    if (existing.length === 0) {
      await root.unsafe("CREATE DATABASE mwagotgo_unit");
    }

    sql = postgres(unitDatabaseUrl, { onnotice: () => {}, max: 1 });
    database = drizzle(sql, { schema }) as unknown as Database;
    await migrate(database, { migrationsFolder: "./src/lib/db/migrations" });
  });

  afterAll(async () => {
    if (database && createdUserIds.length > 0) {
      await database.delete(users).where(inArray(users.id, createdUserIds));
    }

    if (database && createdVerificationTokens.length > 0) {
      await database
        .delete(verificationTokens)
        .where(inArray(verificationTokens.token, createdVerificationTokens));
    }

    await sql?.end();
    await root.end();
  });

  test("removes every row owned by the withdrawn user and leaves everyone else", async () => {
    if (!database) {
      throw new Error("database was not created");
    }

    const owner = await seedUser(database, "owner", createdUserIds);
    const other = await seedUser(database, "other", createdUserIds);
    const verificationToken = `token-${randomUUID()}`;
    createdVerificationTokens.push(verificationToken);

    await database.insert(verificationTokens).values({
      identifier: "nobody@withdrawal.test",
      token: verificationToken,
      expires: new Date(Date.now() + 60_000),
    });

    const repository = new DrizzleAccountWithdrawalRepository(database!);
    const deleted = await repository.deleteAccount(owner.userId);

    expect(deleted).toEqual({ wishlistSlug: owner.slug });
    await expect(countOwnedRows(database!, owner)).resolves.toEqual(emptyCounts);
    await expect(countOwnedRows(database!, other)).resolves.toEqual(seededCounts);

    const [otherProfile] = await database!
      .select()
      .from(profiles)
      .where(eq(profiles.userId, other.userId));
    expect(otherProfile?.displayName).toBe("other");

    const [keptToken] = await database!
      .select()
      .from(verificationTokens)
      .where(eq(verificationTokens.token, verificationToken));
    expect(keptToken?.identifier).toBe("nobody@withdrawal.test");

    const reusedUserId = randomUUID();
    createdUserIds.push(reusedUserId);
    await database!.insert(users).values({
      id: reusedUserId,
      email: `reused-${reusedUserId}@withdrawal.test`,
      name: "다시 가입",
      image: "https://cdn.example/avatar.png",
    });
    await database!.insert(accounts).values({
      userId: reusedUserId,
      type: "oauth",
      provider: "google",
      providerAccountId: owner.providerAccountId,
    });
    await database!.insert(wishlists).values({
      ownerId: reusedUserId,
      slug: owner.slug,
      title: "다시 만든 위시리스트",
    });

    const [reusedWishlist] = await database!
      .select({ slug: wishlists.slug })
      .from(wishlists)
      .where(eq(wishlists.ownerId, reusedUserId));
    expect(reusedWishlist?.slug).toBe(owner.slug);

    await database!.delete(users).where(eq(users.id, reusedUserId));
    await database!
      .delete(verificationTokens)
      .where(eq(verificationTokens.token, verificationToken));
  });
});

const emptyCounts = {
  users: 0,
  accounts: 0,
  sessions: 0,
  authenticators: 0,
  profiles: 0,
  wishlists: 0,
  wishItems: 0,
  messages: 0,
  fundingLogs: 0,
  bankAccounts: 0,
};

const seededCounts = {
  users: 1,
  accounts: 1,
  sessions: 1,
  authenticators: 1,
  profiles: 1,
  wishlists: 1,
  wishItems: 1,
  messages: 1,
  fundingLogs: 1,
  bankAccounts: 1,
};

type SeededUser = {
  userId: string;
  slug: string;
  wishlistId: string;
  wishItemId: string;
  providerAccountId: string;
};

async function seedUser(
  database: Database,
  label: string,
  createdUserIds: string[],
): Promise<SeededUser> {
  const userId = randomUUID();
  const slug = `wd-${label}-${userId.slice(0, 8)}`;
  const providerAccountId = `google-${userId}`;

  await database.insert(users).values({
    id: userId,
    email: `${label}-${userId}@withdrawal.test`,
    name: label,
    image: "https://cdn.example/oauth-avatar.png",
  });
  createdUserIds.push(userId);
  await database.insert(accounts).values({
    userId,
    type: "oauth",
    provider: "google",
    providerAccountId,
  });
  await database.insert(sessions).values({
    sessionToken: randomUUID(),
    userId,
    expires: new Date(Date.now() + 86_400_000),
  });
  await database.insert(authenticators).values({
    credentialID: `cred-${userId}`,
    userId,
    providerAccountId,
    credentialPublicKey: "test-key",
    counter: 0,
    credentialDeviceType: "singleDevice",
    credentialBackedUp: false,
  });
  await database.insert(profiles).values({
    userId,
    displayName: label,
    onboardingCompletedAt: new Date(),
  });
  const [wishlist] = await database
    .insert(wishlists)
    .values({
      ownerId: userId,
      slug,
      title: `${label}의 위시리스트`,
    })
    .returning({ id: wishlists.id });
  const [wishItem] = await database
    .insert(wishItems)
    .values({
      wishlistId: wishlist.id,
      title: "선물",
      targetAmount: 10_000,
      fundedAmount: 1_000,
      imageUrl: "https://shop.example/gift.jpg",
    })
    .returning({ id: wishItems.id });
  const [message] = await database
    .insert(messages)
    .values({
      wishlistId: wishlist.id,
      wishItemId: wishItem.id,
      senderName: "친구",
      body: `${label} 축하`,
      clientRequestId: randomUUID(),
    })
    .returning({ id: messages.id });
  await database.insert(fundingLogs).values({
    wishItemId: wishItem.id,
    messageId: message.id,
    amount: 1_000,
  });
  await database.insert(bankAccounts).values({
    userId,
    bankName: "테스트은행",
    accountHolder: label,
    accountNumberEncrypted: "v1:ciphertext",
    visibility: "copy_only",
  });

  return {
    userId,
    slug,
    wishlistId: wishlist.id,
    wishItemId: wishItem.id,
    providerAccountId,
  };
}

async function countOwnedRows(database: Database, user: SeededUser) {
  const [
    userRows,
    accountRows,
    sessionRows,
    authenticatorRows,
    profileRows,
    wishlistRows,
    wishItemRows,
    messageRows,
    fundingRows,
    bankRows,
  ] = await Promise.all([
    database.select({ id: users.id }).from(users).where(eq(users.id, user.userId)),
    database
      .select({ userId: accounts.userId })
      .from(accounts)
      .where(eq(accounts.userId, user.userId)),
    database
      .select({ userId: sessions.userId })
      .from(sessions)
      .where(eq(sessions.userId, user.userId)),
    database
      .select({ userId: authenticators.userId })
      .from(authenticators)
      .where(eq(authenticators.userId, user.userId)),
    database
      .select({ userId: profiles.userId })
      .from(profiles)
      .where(eq(profiles.userId, user.userId)),
    database
      .select({ id: wishlists.id })
      .from(wishlists)
      .where(eq(wishlists.ownerId, user.userId)),
    database
      .select({ id: wishItems.id })
      .from(wishItems)
      .where(eq(wishItems.wishlistId, user.wishlistId)),
    database
      .select({ id: messages.id })
      .from(messages)
      .where(eq(messages.wishlistId, user.wishlistId)),
    database
      .select({ id: fundingLogs.id })
      .from(fundingLogs)
      .where(eq(fundingLogs.wishItemId, user.wishItemId)),
    database
      .select({ userId: bankAccounts.userId })
      .from(bankAccounts)
      .where(eq(bankAccounts.userId, user.userId)),
  ]);

  return {
    users: userRows.length,
    accounts: accountRows.length,
    sessions: sessionRows.length,
    authenticators: authenticatorRows.length,
    profiles: profileRows.length,
    wishlists: wishlistRows.length,
    wishItems: wishItemRows.length,
    messages: messageRows.length,
    fundingLogs: fundingRows.length,
    bankAccounts: bankRows.length,
  };
}
