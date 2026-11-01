import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
import { encryptAccountNumber } from "../src/lib/settings/account-crypto.ts";
import { formatBirthdayBadge } from "../src/lib/public-wishlist/birthday.ts";
import { PUBLIC_THEME_IDS } from "../src/lib/wishlist/theme.ts";
import {
  BIRTHDAY_BADGE,
  BIRTHDAYS,
  EMAIL_DOMAIN,
  SAMPLE_BIRTHDAY_BADGE,
  SCREENSHOT_ACCOUNT_ENCRYPTION_SECRET,
  SCREENSHOT_DIR,
  SCREENSHOT_FIXED_AT,
  SEEDED_AT,
  SESSION_EXPIRES_AT,
  THEMES,
  buildShots,
  buildUsers,
  fixtureUuid,
  renderScreenshotReadme,
  resolveDatabaseUrl,
  type SeedUser,
} from "../tests/screenshots/fixtures.ts";

process.env.TZ = "UTC";

const ACCOUNT_PLAINTEXT = "3333-12-1234567";

function assertClockFixtures(): void {
  const now = new Date(SCREENSHOT_FIXED_AT);

  for (const key of ["before", "today", "after"] as const) {
    const actual = formatBirthdayBadge(BIRTHDAYS[key], now);

    if (actual !== BIRTHDAY_BADGE[key]) {
      throw new Error(
        `생일 배지가 고정 시각과 다릅니다 (${key}): ${actual} !== ${BIRTHDAY_BADGE[key]}`,
      );
    }
  }

  const sample = formatBirthdayBadge("2000-05-15", now);

  if (sample !== SAMPLE_BIRTHDAY_BADGE) {
    throw new Error(`샘플 생일 배지가 예상과 다릅니다: ${sample}`);
  }

  if (THEMES.join() !== [...PUBLIC_THEME_IDS].join()) {
    throw new Error(
      `테마 목록이 앱과 다릅니다: ${THEMES.join()} !== ${PUBLIC_THEME_IDS.join()}`,
    );
  }
}

async function resetFixtures(
  sql: postgres.TransactionSql,
  users: SeedUser[],
): Promise<void> {
  const tokens = users.flatMap((user) =>
    user.sessionToken ? [user.sessionToken] : [],
  );
  const slugs = users.flatMap((user) =>
    user.wishlist ? [user.wishlist.slug] : [],
  );
  const emails = users.map((user) => user.email);

  await sql`delete from sessions where session_token = any(${tokens})`;
  await sql`delete from users where email = any(${emails}) or email like ${`%${EMAIL_DOMAIN}`}`;
  await sql`delete from wishlists where slug = any(${slugs})`;
}

async function insertUser(
  sql: postgres.TransactionSql,
  user: SeedUser,
  encryptedAccount: string,
): Promise<void> {
  const seededAt = new Date(SEEDED_AT);

  await sql`
    insert into users (id, name, email, email_verified, image)
    values (
      ${user.id},
      ${user.name},
      ${user.email},
      ${seededAt},
      ${null}
    )
  `;
  await sql`
    insert into accounts (
      user_id,
      type,
      provider,
      provider_account_id,
      refresh_token,
      access_token,
      expires_at,
      token_type,
      scope,
      id_token,
      session_state
    )
    values (
      ${user.id},
      ${"oauth"},
      ${"google"},
      ${user.id},
      ${null},
      ${null},
      ${null},
      ${null},
      ${null},
      ${null},
      ${null}
    )
  `;

  if (user.sessionToken) {
    await sql`
      insert into sessions (session_token, user_id, expires)
      values (
        ${user.sessionToken},
        ${user.id},
        ${new Date(SESSION_EXPIRES_AT)}
      )
    `;
  }

  if (user.profile) {
    await sql`
      insert into profiles (
        id,
        user_id,
        display_name,
        birthday,
        description,
        onboarding_completed_at,
        created_at,
        updated_at
      )
      values (
        ${user.profile.id},
        ${user.id},
        ${user.profile.displayName},
        ${user.profile.birthday},
        ${user.profile.description},
        ${seededAt},
        ${seededAt},
        ${seededAt}
      )
    `;
  }

  if (user.wishlist && user.profile) {
    await sql`
      insert into wishlists (
        id,
        owner_id,
        slug,
        title,
        theme_id,
        visibility,
        messages_read_at,
        created_at,
        updated_at
      )
      values (
        ${user.wishlist.id},
        ${user.id},
        ${user.wishlist.slug},
        ${user.wishlist.title},
        ${user.wishlist.themeId},
        ${"public"},
        ${null},
        ${seededAt},
        ${seededAt}
      )
    `;
  }

  if (user.bankId && user.profile) {
    await sql`
      insert into bank_accounts (
        id,
        user_id,
        bank_name,
        account_holder,
        account_number_encrypted,
        visibility,
        created_at,
        updated_at
      )
      values (
        ${user.bankId},
        ${user.id},
        ${"카카오뱅크"},
        ${user.profile.displayName},
        ${encryptedAccount},
        ${"always_visible"},
        ${seededAt},
        ${seededAt}
      )
    `;
  }

  for (const wish of user.wishes) {
    if (!user.wishlist) {
      throw new Error(`${user.email} has wishes without a wishlist`);
    }

    await sql`
      insert into wish_items (
        id,
        wishlist_id,
        title,
        description,
        target_amount,
        funded_amount,
        product_url,
        image_url,
        status,
        sort_order,
        created_at,
        updated_at
      )
      values (
        ${wish.id},
        ${user.wishlist.id},
        ${wish.title},
        ${wish.description},
        ${wish.targetAmount},
        ${wish.fundedAmount},
        ${wish.productUrl},
        ${wish.imageUrl},
        ${wish.status},
        ${wish.sortOrder},
        ${seededAt},
        ${seededAt}
      )
    `;
  }

  for (const [index, message] of user.messages.entries()) {
    if (!user.wishlist) {
      throw new Error(`${user.email} has messages without a wishlist`);
    }

    const createdAt = new Date(message.createdAt);

    await sql`
      insert into messages (
        id,
        wishlist_id,
        wish_item_id,
        sender_name,
        body,
        is_hidden,
        client_request_id,
        created_at
      )
      values (
        ${message.id},
        ${user.wishlist.id},
        ${message.wishItemId},
        ${message.senderName},
        ${message.body},
        ${message.isHidden},
        ${message.clientRequestId},
        ${createdAt}
      )
    `;

    if (message.amount !== null && message.wishItemId) {
      await sql`
        insert into funding_logs (
          id,
          wish_item_id,
          message_id,
          amount,
          created_at
        )
        values (
          ${fixtureUuid(40_000 + index)},
          ${message.wishItemId},
          ${message.id},
          ${message.amount},
          ${createdAt}
        )
      `;
    }
  }
}

async function assertTimestampRoundtrip(
  sql: postgres.Sql,
  users: SeedUser[],
): Promise<void> {
  const message = users
    .flatMap((user) => user.messages)
    .find((item) => item.body.length >= 200);

  if (!message) {
    throw new Error("long message missing after build");
  }

  const [row] = await sql<{ created_at: Date }[]>`
    select created_at from messages where id = ${message.id}
  `;
  const drift = Math.abs(row.created_at.getTime() - Date.parse(message.createdAt));

  if (drift > 1000) {
    throw new Error(
      `메시지 시각이 UTC로 왕복하지 않았습니다. db=${row.created_at.toISOString()} seed=${message.createdAt} drift=${drift}`,
    );
  }
}

async function writeReadme(users: SeedUser[]): Promise<void> {
  const directory = path.join(process.cwd(), SCREENSHOT_DIR);
  await mkdir(directory, { recursive: true });
  await writeFile(
    path.join(directory, "README.md"),
    renderScreenshotReadme(users, buildShots()),
    "utf8",
  );
}

export async function seedScreenshots(): Promise<void> {
  assertClockFixtures();

  const databaseUrl = resolveDatabaseUrl();
  const encrypted = encryptAccountNumber(
    ACCOUNT_PLAINTEXT,
    SCREENSHOT_ACCOUNT_ENCRYPTION_SECRET,
  );

  if (!encrypted.ok) {
    throw new Error("계좌번호 암호화에 실패했습니다.");
  }

  const users = buildUsers();
  const sql = postgres(databaseUrl, {
    prepare: false,
    connect_timeout: 10,
    connection: {
      TimeZone: "UTC",
    },
  });

  try {
    await sql.begin(async (tx) => {
      await resetFixtures(tx, users);

      for (const user of users) {
        await insertUser(tx, user, encrypted.value);
      }
    });

    await assertTimestampRoundtrip(sql, users);
    await writeReadme(users);

    const wishCount = users.reduce((sum, user) => sum + user.wishes.length, 0);
    const messageCount = users.reduce(
      (sum, user) => sum + user.messages.length,
      0,
    );
    console.log(
      `screenshot seed ok users=${users.length} wishes=${wishCount} messages=${messageCount}`,
    );
  } finally {
    await sql.end();
  }
}

await seedScreenshots();
