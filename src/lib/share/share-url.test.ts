import { describe, expect, test } from "vitest";
import { buildWishlistShareUrl } from "./share-url";

describe("wishlist share URLs", () => {
  test("shares a real wishlist whose slug is sample as a wishlist", () => {
    expect(buildWishlistShareUrl("https://example.com", "sample", "owner")).toBe(
      "https://example.com/wishlist/sample?utm_source=owner_share&utm_medium=share",
    );
  });

  test("shares the demo page with its rendered theme", () => {
    expect(
      buildWishlistShareUrl(
        "https://example.com",
        "sample",
        "visitor",
        "soft_pastel",
      ),
    ).toBe(
      "https://example.com/sample?theme=soft_pastel&utm_source=visitor_share&utm_medium=share",
    );
  });
});
