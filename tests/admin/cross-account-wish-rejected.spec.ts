// spec: specs/admin-management.md
// seed: tests/admin/seed.spec.ts

import { eq } from "drizzle-orm";
import { wishItems } from "@/src/lib/db/schema";
import { test, expect } from "../fixtures/admin";

test.describe("Cross Account Access", () => {
  test("Cross Account Wish Rejected", async ({
    page,
    seedAdmin,
    signIn,
    e2eDb,
  }) => {
    // 1. [사전 조건] 주인 B 와 요청자 A 를 만들고 A 만 로그인합니다. `/admin/wishes` 로 이동해 `등록된 선물이 없습니다.` 를 기다립니다.
    const owner = await seedAdmin({
      displayName: "E2E 주인",
      items: [{ title: "캠핑 의자", targetAmount: 80_000, fundedAmount: 20_000 }],
    });
    const other = await seedAdmin({ displayName: "E2E 다른 사람" });
    await signIn(other);

    await page.goto("/admin/wishes");
    await expect(page.getByText("등록된 선물이 없습니다.")).toBeVisible({
      timeout: 30_000,
    });

    // expect: A 의 화면에 레벨 3 제목 `캠핑 의자` 가 없다(남의 선물이 보이지 않음).
    await expect(
      page.getByRole("heading", { level: 3, name: "캠핑 의자" }),
    ).toHaveCount(0);

    const wishUrl = `/api/admin/wishes/${owner.items[0].id}`;

    // 2. B 의 선물 id 로 form 수정을 보냅니다.
    const patchResponse = await page.request.post(wishUrl, {
      form: {
        _method: "patch",
        title: "바뀐 이름",
        targetAmount: "1",
        status: "hidden",
      },
      maxRedirects: 0,
    });

    // expect: 상태 `307`, `location` pathname `/admin/wishes`, search `?error=wish_not_found` 이다.
    expect(patchResponse.status()).toBe(307);
    const patchLocation = new URL(patchResponse.headers()["location"]);
    expect(patchLocation.pathname).toBe("/admin/wishes");
    expect(patchLocation.search).toBe("?error=wish_not_found");

    // 3. form 삭제를 보냅니다.
    const deleteResponse = await page.request.post(wishUrl, {
      form: { _method: "delete" },
      maxRedirects: 0,
    });

    // expect: 상태 `307`, `location` 이 `/admin/wishes?error=wish_not_found` 이다.
    expect(deleteResponse.status()).toBe(307);
    const deleteLocation = new URL(deleteResponse.headers()["location"]);
    expect(deleteLocation.pathname).toBe("/admin/wishes");
    expect(deleteLocation.search).toBe("?error=wish_not_found");

    // 4. JSON 수정·삭제를 보냅니다.
    const jsonPatchResponse = await page.request.patch(wishUrl, {
      data: { title: "바뀐 이름", targetAmount: 1, status: "hidden" },
    });
    const jsonDeleteResponse = await page.request.delete(wishUrl);

    // expect: 둘 다 상태 `404`, 본문 `{ error: "wish_not_found" }` 이다.
    expect(jsonPatchResponse.status()).toBe(404);
    expect(await jsonPatchResponse.json()).toEqual({ error: "wish_not_found" });
    expect(jsonDeleteResponse.status()).toBe(404);
    expect(await jsonDeleteResponse.json()).toEqual({ error: "wish_not_found" });

    // 5. [e2eDb 조회, 코드 근거] B 의 선물과 A 의 위시리스트를 조회합니다.
    const [ownerItem] = await e2eDb
      .select()
      .from(wishItems)
      .where(eq(wishItems.id, owner.items[0].id));

    // expect: B 의 `wish_items` 가 남아 있고 `title` `캠핑 의자`, `targetAmount` `80000`, `fundedAmount` `20000`, `status` `open` 그대로이다.
    expect(ownerItem).toBeDefined();
    expect(ownerItem.title).toBe("캠핑 의자");
    expect(ownerItem.targetAmount).toBe(80_000);
    expect(ownerItem.fundedAmount).toBe(20_000);
    expect(ownerItem.status).toBe("open");

    // expect: A 의 위시리스트(`wishlistId = other.wishlistId`) `wish_items` 가 0행이다.
    const otherItems = await e2eDb
      .select()
      .from(wishItems)
      .where(eq(wishItems.wishlistId, other.wishlistId!));
    expect(otherItems).toHaveLength(0);
  });
});
