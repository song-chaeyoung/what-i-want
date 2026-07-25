import { describe, expect, test } from "vitest";
import {
  hasSeenAdminGuide,
  markAdminGuideSeen,
} from "@/app/admin/admin-guide-storage";

function createMemoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value);
    },
    removeItem: (key) => {
      map.delete(key);
    },
    clear: () => {
      map.clear();
    },
    key: (index) => Array.from(map.keys())[index] ?? null,
    get length() {
      return map.size;
    },
  } satisfies Storage;
}

function createThrowingStorage(): Storage {
  const rejectAll = () => {
    throw new Error("storage disabled");
  };
  return {
    getItem: rejectAll,
    setItem: rejectAll,
    removeItem: rejectAll,
    clear: rejectAll,
    key: rejectAll,
    length: 0,
  } as Storage;
}

describe("admin guide seen flag", () => {
  test("reports unseen until marked, then seen after marking", () => {
    const storage = createMemoryStorage();

    expect(hasSeenAdminGuide(storage)).toBe(false);

    markAdminGuideSeen(storage);

    expect(hasSeenAdminGuide(storage)).toBe(true);
  });

  test("treats an unreadable storage as unseen instead of throwing", () => {
    const storage = createThrowingStorage();

    expect(hasSeenAdminGuide(storage)).toBe(false);
  });

  test("swallows write failures so guide dismissal never crashes", () => {
    const storage = createThrowingStorage();

    expect(() => markAdminGuideSeen(storage)).not.toThrow();
  });
});
