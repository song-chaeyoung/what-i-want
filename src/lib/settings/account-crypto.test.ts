import { describe, expect, test } from "vitest";
import {
  decryptAccountNumber,
  encryptAccountNumber,
} from "./account-crypto";

describe("account number crypto", () => {
  test("encrypts without storing the source account number", () => {
    const source = "3333-12-1234567";

    const result = encryptAccountNumber(
      source,
      "test-secret-test-secret-test-secret-test-secret",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected encryption to succeed");
    }
    expect(result.value).toMatch(/^v1:/);
    expect(result.value).not.toContain(source);
    expect(
      decryptAccountNumber(
        result.value,
        "test-secret-test-secret-test-secret-test-secret",
      ),
    ).toBe(source);
  });

  test("rejects missing encryption secrets", () => {
    expect(encryptAccountNumber("3333-12-1234567", "")).toEqual({
      ok: false,
      error: "missing_secret",
    });
  });

  test("returns null for malformed encrypted account numbers", () => {
    expect(
      decryptAccountNumber(
        "not-an-encrypted-value",
        "test-secret-test-secret-test-secret-test-secret",
      ),
    ).toBeNull();
  });
});
