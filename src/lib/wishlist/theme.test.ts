import { describe, expect, test } from "vitest";
import {
  DEFAULT_PUBLIC_THEME_ID,
  PUBLIC_THEME_IDS,
  isPublicThemeId,
  parsePublicThemeId,
} from "./theme";

describe("public wishlist themes", () => {
  test("defines the initial public theme ids", () => {
    expect(PUBLIC_THEME_IDS).toEqual(["pixel_y2k", "mono_bw", "soft_pastel"]);
  });

  test("uses pixel_y2k as the default theme", () => {
    expect(DEFAULT_PUBLIC_THEME_ID).toBe("pixel_y2k");
    expect(parsePublicThemeId(undefined)).toBe("pixel_y2k");
  });

  test("recognizes valid theme ids", () => {
    expect(isPublicThemeId("mono_bw")).toBe(true);
    expect(parsePublicThemeId("soft_pastel")).toBe("soft_pastel");
  });

  test("falls back to the default for unknown theme ids", () => {
    expect(isPublicThemeId("unknown")).toBe(false);
    expect(parsePublicThemeId("unknown")).toBe("pixel_y2k");
  });
});
