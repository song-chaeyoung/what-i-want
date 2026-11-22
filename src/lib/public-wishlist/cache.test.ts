import { beforeEach, describe, expect, test, vi } from "vitest";
import { revalidateTag, unstable_cache } from "next/cache";
import { POST } from "@/app/api/admin/settings/route";
import type {
  SettingsRecord,
  UpdateSettingsRecord,
} from "@/src/lib/settings/types";
import {
  getCachedPublicWishlist,
  revalidatePublicWishlist,
  revalidatePublicWishlistByOwner,
} from "./cache";

const fixture = vi.hoisted(() => ({
  entries: new Map<string, { value: unknown; tags: string[] }>(),
  isPublic: true,
  slug: "birthday",
  read: vi.fn(),
}));

vi.mock("next/cache", () => ({
  unstable_cache: vi.fn(
    (read: () => Promise<unknown>, keys: string[], options: { tags: string[] }) =>
      async () => {
        const key = JSON.stringify(keys);
        if (!fixture.entries.has(key)) {
          fixture.entries.set(key, { value: await read(), tags: options.tags });
        }
        return fixture.entries.get(key)!.value;
      },
  ),
  revalidateTag: vi.fn((tag: string) => {
    for (const [key, entry] of fixture.entries) {
      if (entry.tags.includes(tag)) {
        fixture.entries.delete(key);
      }
    }
  }),
}));
vi.mock("./repository", () => ({
  DrizzlePublicWishlistRepository: class {
    async findPublicWishlistBySlug(slug: string) {
      fixture.read(slug);
      return fixture.isPublic && slug === fixture.slug
        ? {
            id: "wishlist-1",
            slug,
            title: "Birthday",
            themeId: "pixel_y2k",
            ownerBirthday: null,
            ownerDescription: null,
          }
        : null;
    }
    async listWishItems() {
      return [];
    }
    async findBankAccountByWishlistId() {
      return null;
    }
  },
}));
vi.mock("@/src/lib/wishes/repository", () => ({
  DrizzleWishRepository: class {
    async findWishlistByOwnerId() {
      return { slug: fixture.slug };
    }
  },
}));
vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { id: "user-1" } })),
}));
vi.mock("@/src/lib/settings/repository", () => ({
  DrizzleSettingsRepository: class {
    async getSettingsByOwnerId(): Promise<SettingsRecord> {
      return {
        profile: { displayName: "Owner", birthday: null, description: null },
        wishlist: {
          id: "wishlist-1",
          slug: fixture.slug,
          title: "Birthday",
          themeId: "pixel_y2k",
          visibility: fixture.isPublic ? "public" : "private",
        },
        bankAccount: null,
      };
    }
    async isWishlistSlugAvailable() {
      return true;
    }
    async updateSettings(_ownerId: string, record: UpdateSettingsRecord) {
      fixture.slug = record.wishlist.slug;
      fixture.isPublic = record.wishlist.visibility === "public";
      return this.getSettingsByOwnerId();
    }
  },
}));

const notFound = { ok: false, error: "not_found" };

function settingsRequest(slug: string, visibility = "public") {
  return new Request("https://example.com/api/admin/settings", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      displayName: "Owner",
      wishlistSlug: slug,
      wishlistTitle: "Birthday",
      wishlistVisibility: visibility,
      themeId: "pixel_y2k",
    }),
  });
}

describe("public wishlist cache behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fixture.entries.clear();
    fixture.isPublic = true;
    fixture.slug = "birthday";
  });

  test("shares one cached read across normalized slug aliases", async () => {
    const uppercase = await getCachedPublicWishlist("BIRTHDAY");
    expect(await getCachedPublicWishlist("birthday")).toEqual(uppercase);
    expect(await getCachedPublicWishlist(" birthday ")).toEqual(uppercase);
    expect(fixture.read).toHaveBeenCalledExactlyOnceWith("birthday");
  });

  test("owner changes immediately revoke every cached slug alias", async () => {
    expect(await getCachedPublicWishlist("BIRTHDAY")).toMatchObject({ ok: true });
    await getCachedPublicWishlist("birthday");
    fixture.isPublic = false;
    await revalidatePublicWishlistByOwner("user-1");
    expect(await getCachedPublicWishlist("BIRTHDAY")).toEqual(notFound);
    expect(await getCachedPublicWishlist("birthday")).toEqual(notFound);
    expect(revalidateTag).toHaveBeenCalledWith("public-wishlist:birthday", {
      expire: 0,
    });
  });

  test("normalizes explicit invalidation exactly like cache reads", async () => {
    await getCachedPublicWishlist("birthday");
    fixture.isPublic = false;
    revalidatePublicWishlist("  BIRTHDAY  ");
    expect(await getCachedPublicWishlist("birthday")).toEqual(notFound);
  });

  test("does not reuse raw-slug cache entries retained from an older deployment", async () => {
    for (const slug of ["birthday", "BIRTHDAY"]) {
      fixture.entries.set(JSON.stringify(["public-wishlist", slug]), {
        value: { ok: true, wishlist: { title: "Old private data" } },
        tags: [`public-wishlist:${slug}`],
      });
    }
    fixture.isPublic = false;
    expect(await getCachedPublicWishlist("birthday")).toEqual(notFound);
    expect(await getCachedPublicWishlist("BIRTHDAY")).toEqual(notFound);
  });

  test("does not query, cache or invalidate malformed slugs", async () => {
    expect(await getCachedPublicWishlist("not a slug")).toEqual(notFound);
    revalidatePublicWishlist("not a slug");
    expect(fixture.read).not.toHaveBeenCalled();
    expect(unstable_cache).not.toHaveBeenCalled();
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  test("settings rename expires old aliases and the new address's cached 404", async () => {
    await getCachedPublicWishlist("birthday");
    await getCachedPublicWishlist("BIRTHDAY");
    expect(await getCachedPublicWishlist("new-birthday")).toEqual(notFound);

    const response = await POST(settingsRequest("new-birthday"));

    expect(response.status).toBe(200);
    expect(Object.keys(await response.json())).toEqual(["settings"]);
    expect(await getCachedPublicWishlist("birthday")).toEqual(notFound);
    expect(await getCachedPublicWishlist("BIRTHDAY")).toEqual(notFound);
    expect(await getCachedPublicWishlist("new-birthday")).toMatchObject({
      ok: true,
      wishlist: { slug: "new-birthday" },
    });
  });

  test("saving private settings revokes old slug aliases", async () => {
    await getCachedPublicWishlist("BIRTHDAY");

    expect((await POST(settingsRequest("birthday", "private"))).status).toBe(200);
    expect(await getCachedPublicWishlist("birthday")).toEqual(notFound);
    expect(await getCachedPublicWishlist("BIRTHDAY")).toEqual(notFound);
  });

  test("settings validation failures preserve the cached public page", async () => {
    const before = await getCachedPublicWishlist("birthday");

    expect((await POST(settingsRequest("not a slug"))).status).toBe(400);
    expect(revalidateTag).not.toHaveBeenCalled();
    expect(await getCachedPublicWishlist("birthday")).toEqual(before);
    expect(fixture.read).toHaveBeenCalledTimes(1);
  });
});
