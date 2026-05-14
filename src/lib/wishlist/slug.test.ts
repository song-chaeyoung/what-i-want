import { describe, expect, test } from "vitest";
import { parseWishlistSlug } from "./slug";

describe("parseWishlistSlug", () => {
  test("normalizes uppercase letters and surrounding spaces", () => {
    expect(parseWishlistSlug("  Birthday-Wish  ")).toEqual({
      ok: true,
      value: "birthday-wish",
    });
  });

  test("accepts lowercase letters, numbers, and hyphens", () => {
    expect(parseWishlistSlug("wish-list-2026")).toEqual({
      ok: true,
      value: "wish-list-2026",
    });
  });

  test("rejects underscores", () => {
    expect(parseWishlistSlug("wish_list")).toEqual({
      ok: false,
      error: "invalid_format",
    });
  });

  test("rejects values shorter than 3 characters", () => {
    expect(parseWishlistSlug("ab")).toEqual({
      ok: false,
      error: "too_short",
    });
  });

  test("rejects values longer than 32 characters", () => {
    expect(parseWishlistSlug("a".repeat(33))).toEqual({
      ok: false,
      error: "too_long",
    });
  });
});
