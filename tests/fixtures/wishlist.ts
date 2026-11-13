import { randomUUID } from "node:crypto";
import { test as base } from "@playwright/test";
import { inArray } from "drizzle-orm";
import {
  bankAccounts,
  users,
  wishItems,
  wishlists,
} from "@/src/lib/db/schema";
import { encryptAccountNumber } from "@/src/lib/settings/account-crypto";
import {
  createE2EDatabase,
  E2E_ACCOUNT_ENCRYPTION_SECRET,
  E2E_EMAIL_DOMAIN,
  type E2EDatabase,
} from "../support/e2e-db";

type SeedWishItemInput = Pick<
  typeof wishItems.$inferInsert,
  "title" | "targetAmount" | "fundedAmount" | "status"
>;

type SeedBankAccountInput = Pick<
  typeof bankAccounts.$inferInsert,
  "bankName" | "accountHolder" | "visibility"
> & {
  accountNumber: string;
};

export type SeedWishlistInput = Pick<
  typeof wishlists.$inferInsert,
  "title" | "visibility"
> & {
  // 배열 순서가 화면의 카드 순서(sortOrder)가 된다.
  items?: SeedWishItemInput[];
  bankAccount?: SeedBankAccountInput;
};

export type SeededWishlist = {
  slug: string;
  wishlistId: string;
  items: { id: string; title: string }[];
};

export const test = base.extend<
  { seedWishlist: (input: SeedWishlistInput) => Promise<SeededWishlist> },
  { e2eDb: E2EDatabase }
>({
  // fixture의 두 번째 인자를 `use`라고 부르면 react-hooks/rules-of-hooks가 React Hook으로 오인해서 `provide`로 부른다.
  e2eDb: [
    async ({}, provide) => {
      const { db, close } = createE2EDatabase();
      await provide(db);
      await close();
    },
    { scope: "worker" },
  ],

  seedWishlist: async ({ e2eDb }, provide) => {
    const userIds: string[] = [];

    await provide(async ({ items = [], bankAccount, ...wishlist }) => {
      // 제출 제한과 공개 페이지 캐시가 slug 단위라서, 호출마다 새 slug를 만들어 테스트끼리 공유하지 않게 한다.
      const slug = `e2e-${randomUUID().replaceAll("-", "").slice(0, 12)}`;

      const [user] = await e2eDb
        .insert(users)
        .values({ email: `${slug}@${E2E_EMAIL_DOMAIN}` })
        .returning({ id: users.id });
      userIds.push(user.id);

      const [createdWishlist] = await e2eDb
        .insert(wishlists)
        .values({ ...wishlist, ownerId: user.id, slug })
        .returning({ id: wishlists.id });

      const createdItems =
        items.length > 0
          ? await e2eDb
              .insert(wishItems)
              .values(
                items.map((item, index) => ({
                  ...item,
                  wishlistId: createdWishlist.id,
                  sortOrder: index,
                })),
              )
              .returning({ id: wishItems.id, title: wishItems.title })
          : [];

      if (bankAccount) {
        const { accountNumber, ...account } = bankAccount;
        const encrypted = encryptAccountNumber(
          accountNumber,
          E2E_ACCOUNT_ENCRYPTION_SECRET,
        );

        if (!encrypted.ok) {
          throw new Error(encrypted.error);
        }

        await e2eDb.insert(bankAccounts).values({
          ...account,
          userId: user.id,
          accountNumberEncrypted: encrypted.value,
        });
      }

      return {
        slug,
        wishlistId: createdWishlist.id,
        items: createdItems,
      };
    });

    // users를 지우면 위시리스트·소원·계좌·메시지·후원 기록이 FK cascade로 함께 지워진다.
    if (userIds.length > 0) {
      await e2eDb.delete(users).where(inArray(users.id, userIds));
    }
  },
});

export { expect } from "@playwright/test";
