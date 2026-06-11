import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { PUBLIC_THEME_IDS } from "@/src/lib/wishlist/theme";

const wishStatusValues = ["open", "fulfilled", "hidden", "paused"] as const;
const wishlistVisibilityValues = ["public"] as const;
const accountVisibilityValues = [
  "always_visible",
  "reveal_on_click",
  "copy_only",
  "hidden",
] as const;

export const publicThemeEnum = pgEnum("public_theme", PUBLIC_THEME_IDS);
export const wishlistVisibilityEnum = pgEnum(
  "wishlist_visibility",
  wishlistVisibilityValues,
);
export const wishStatusEnum = pgEnum("wish_status", wishStatusValues);
export const accountVisibilityEnum = pgEnum(
  "account_visibility",
  accountVisibilityValues,
);

export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  displayName: varchar("display_name", { length: 80 }).notNull(),
  birthday: date("birthday", { mode: "string" }),
  description: text("description"),
  onboardingCompletedAt: timestamp("onboarding_completed_at", {
    mode: "date",
  }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const wishlists = pgTable("wishlists", {
  id: uuid("id").defaultRandom().primaryKey(),
  ownerId: uuid("owner_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  slug: varchar("slug", { length: 32 }).notNull().unique(),
  title: varchar("title", { length: 120 }).notNull(),
  themeId: publicThemeEnum("theme_id").default("pixel_y2k").notNull(),
  visibility: wishlistVisibilityEnum("visibility")
    .default("public")
    .notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const wishItems = pgTable(
  "wish_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    wishlistId: uuid("wishlist_id")
      .notNull()
      .references(() => wishlists.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 120 }).notNull(),
    description: text("description"),
    targetAmount: integer("target_amount"),
    fundedAmount: integer("funded_amount").default(0).notNull(),
    productUrl: text("product_url"),
    imageUrl: text("image_url"),
    status: wishStatusEnum("status").default("open").notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (wishItem) => [index("wish_items_wishlist_id_idx").on(wishItem.wishlistId)],
);

export const bankAccounts = pgTable("bank_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  bankName: varchar("bank_name", { length: 80 }).notNull(),
  accountHolder: varchar("account_holder", { length: 80 }).notNull(),
  accountNumberEncrypted: text("account_number_encrypted").notNull(),
  visibility: accountVisibilityEnum("visibility").default("hidden").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    wishlistId: uuid("wishlist_id")
      .notNull()
      .references(() => wishlists.id, { onDelete: "cascade" }),
    wishItemId: uuid("wish_item_id").references(() => wishItems.id, {
      onDelete: "set null",
    }),
    senderName: varchar("sender_name", { length: 80 }),
    body: text("body").notNull(),
    isHidden: boolean("is_hidden").default(false).notNull(),
    clientRequestId: varchar("client_request_id", { length: 64 }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (message) => [
    index("messages_wishlist_id_idx").on(message.wishlistId),
    uniqueIndex("messages_client_request_id_idx").on(message.clientRequestId),
  ],
);

export const fundingLogs = pgTable(
  "funding_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    wishItemId: uuid("wish_item_id")
      .notNull()
      .references(() => wishItems.id, { onDelete: "cascade" }),
    messageId: uuid("message_id").references(() => messages.id, {
      onDelete: "set null",
    }),
    amount: integer("amount").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (fundingLog) => [
    index("funding_logs_wish_item_id_idx").on(fundingLog.wishItemId),
  ],
);

export const profileRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const wishlistRelations = relations(wishlists, ({ one, many }) => ({
  owner: one(users, {
    fields: [wishlists.ownerId],
    references: [users.id],
  }),
  items: many(wishItems),
  messages: many(messages),
}));

export const wishItemRelations = relations(wishItems, ({ one, many }) => ({
  wishlist: one(wishlists, {
    fields: [wishItems.wishlistId],
    references: [wishlists.id],
  }),
  fundingLogs: many(fundingLogs),
}));
