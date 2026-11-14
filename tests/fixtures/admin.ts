import { randomUUID } from "node:crypto";
import { inArray } from "drizzle-orm";
import {
  fundingLogs,
  messages,
  profiles,
  sessions,
  users,
  wishItems,
  wishlists,
} from "@/src/lib/db/schema";
import { E2E_EMAIL_DOMAIN } from "../support/e2e-db";
import { test as base } from "./wishlist";

// auth.ts는 http에서 `__Secure-` 접두사 없는 Auth.js 기본 이름을 쓴다(@auth/core lib/utils/cookie.js defaultCookies).
const SESSION_COOKIE_NAME = "authjs.session-token";

// app/admin/admin-guide-storage.ts의 "이미 봤음" 표시. 1차 범위는 첫 진입 안내 모달을 다루지 않아서 끈다.
const ADMIN_GUIDE_SEEN_KEY = "mwagotgo:admin-guide-seen";

type SeedAdminWishInput = Pick<
  typeof wishItems.$inferInsert,
  "title" | "targetAmount" | "fundedAmount" | "status"
>;

type SeedAdminMessageInput = Pick<
  typeof messages.$inferInsert,
  "senderName" | "body" | "isHidden"
> & {
  // items 배열의 위치. 지정하면 그 선물에 보낸 참여 기록이 된다.
  wishItemIndex?: number;
  // 지정하면 funding_logs 행을 만든다. 선물의 fundedAmount는 테스트가 items에서 직접 맞춘다.
  amount?: number;
};

export type SeedAdminInput = {
  // false면 소셜 로그인 직후처럼 users만 만들고 profiles·wishlists는 만들지 않는다.
  onboarded?: boolean;
  displayName?: string;
  // 배열 순서가 sortOrder가 된다.
  items?: SeedAdminWishInput[];
  // 배열 순서가 메시지함의 표시 순서(최신순)가 된다.
  messages?: SeedAdminMessageInput[];
};

export type SeededAdmin = {
  userId: string;
  email: string;
  sessionToken: string;
  // onboarded: false면 null이다.
  wishlistId: string | null;
  slug: string | null;
  items: { id: string; title: string }[];
  messages: { id: string; body: string }[];
};

export const test = base.extend<{
  seedAdmin: (input?: SeedAdminInput) => Promise<SeededAdmin>;
  signIn: (admin: Pick<SeededAdmin, "sessionToken">) => Promise<void>;
}>({
  seedAdmin: async ({ e2eDb }, provide) => {
    const userIds: string[] = [];

    await provide(
      async ({
        onboarded = true,
        displayName = "E2E 관리자",
        items = [],
        messages: messageInputs = [],
      } = {}) => {
        const key = randomUUID().replaceAll("-", "").slice(0, 12);
        const email = `admin-${key}@${E2E_EMAIL_DOMAIN}`;

        const [user] = await e2eDb
          .insert(users)
          .values({ email, name: displayName })
          .returning({ id: users.id });
        userIds.push(user.id);

        // OAuth 대신 database 세션 행을 직접 만든다. 쿠키 값이 이 sessionToken이다.
        const sessionToken = randomUUID();
        await e2eDb.insert(sessions).values({
          sessionToken,
          userId: user.id,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

        if (!onboarded) {
          return {
            userId: user.id,
            email,
            sessionToken,
            wishlistId: null,
            slug: null,
            items: [],
            messages: [],
          };
        }

        const now = new Date();
        await e2eDb.insert(profiles).values({
          userId: user.id,
          displayName,
          onboardingCompletedAt: now,
        });

        const slug = `e2e-${key}`;
        const [wishlist] = await e2eDb
          .insert(wishlists)
          .values({
            ownerId: user.id,
            slug,
            title: `${displayName}님의 위시리스트`,
          })
          .returning({ id: wishlists.id });

        const createdItems =
          items.length > 0
            ? await e2eDb
                .insert(wishItems)
                .values(
                  items.map((item, index) => ({
                    ...item,
                    wishlistId: wishlist.id,
                    sortOrder: index,
                  })),
                )
                .returning({ id: wishItems.id, title: wishItems.title })
            : [];

        const createdMessages: SeededAdmin["messages"] = [];

        for (const [index, input] of messageInputs.entries()) {
          const { wishItemIndex, amount, ...message } = input;
          const wishItemId =
            wishItemIndex === undefined ? null : createdItems[wishItemIndex].id;

          const [created] = await e2eDb
            .insert(messages)
            .values({
              ...message,
              wishlistId: wishlist.id,
              wishItemId,
              // 로컬 Postgres 세션 시간대(Asia/Seoul)에서 defaultNow()는 Drizzle이 UTC로 읽는 값보다 9시간 앞선다.
              // 읽음 기준(messagesReadAt)과 비교되도록 Node 시각을 1분 간격 과거로 넣는다(첫 항목이 가장 최근).
              createdAt: new Date(now.getTime() - (index + 1) * 60_000),
            })
            .returning({ id: messages.id, body: messages.body });
          createdMessages.push(created);

          if (amount !== undefined) {
            if (!wishItemId) {
              throw new Error("amount needs wishItemIndex");
            }

            await e2eDb
              .insert(fundingLogs)
              .values({ wishItemId, messageId: created.id, amount });
          }
        }

        return {
          userId: user.id,
          email,
          sessionToken,
          wishlistId: wishlist.id,
          slug,
          items: createdItems,
          messages: createdMessages,
        };
      },
    );

    // users를 지우면 세션·프로필·위시리스트·선물·메시지·후원 기록이 FK cascade로 함께 지워진다.
    if (userIds.length > 0) {
      await e2eDb.delete(users).where(inArray(users.id, userIds));
    }
  },

  signIn: async ({ context, baseURL }, provide) => {
    await provide(async ({ sessionToken }) => {
      await context.addCookies([
        {
          name: SESSION_COOKIE_NAME,
          value: sessionToken,
          url: baseURL,
          httpOnly: true,
          sameSite: "Lax",
        },
      ]);
      await context.addInitScript((key) => {
        window.localStorage.setItem(key, "1");
      }, ADMIN_GUIDE_SEEN_KEY);
    });
  },
});

export { expect } from "@playwright/test";
