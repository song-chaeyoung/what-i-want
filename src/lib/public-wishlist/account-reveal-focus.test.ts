import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import {
  ACCOUNT_REVEAL_RETURN_FOCUS_KEY,
  accountRevealTabTarget,
  openDetailsAndFocus,
  rememberAccountRevealTrigger,
  restoreAccountRevealTriggerFocus,
  takeAccountRevealTriggerId,
} from "./account-reveal-focus";

class MemoryStorage {
  values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe("account reveal focus", () => {
  const storage = new MemoryStorage();
  const originalStorage = globalThis.sessionStorage;

  afterEach(() => {
    storage.values.clear();
    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      value: originalStorage,
    });
  });

  test("remembers the send button and forgets it after it is read", () => {
    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      value: storage,
    });

    rememberAccountRevealTrigger("participation-submit-wish-1");

    expect(storage.getItem(ACCOUNT_REVEAL_RETURN_FOCUS_KEY)).toBe(
      "participation-submit-wish-1",
    );
    expect(takeAccountRevealTriggerId()).toBe("participation-submit-wish-1");
    expect(storage.getItem(ACCOUNT_REVEAL_RETURN_FOCUS_KEY)).toBeNull();
  });

  test("opens the gift form and focuses the remembered send button", () => {
    const details = { open: false };
    let focused = false;
    const trigger = {
      closest: (selector: string) => (selector === "details" ? details : null),
      focus: () => {
        focused = true;
      },
    };

    openDetailsAndFocus(trigger);

    expect(details.open).toBe(true);
    expect(focused).toBe(true);
  });

  test("keeps Tab inside the dialog and wraps at both ends", () => {
    const copy = { name: "계좌번호 복사" };
    const link = { name: "link" };
    const close = { name: "닫기" };
    const outside = { name: "outside" };
    const stops = [copy, link, close];

    expect(accountRevealTabTarget(stops, copy, false)).toBeNull();
    expect(accountRevealTabTarget(stops, link, false)).toBeNull();
    expect(accountRevealTabTarget(stops, close, false)).toBe(copy);
    expect(accountRevealTabTarget(stops, outside, false)).toBe(copy);
    expect(accountRevealTabTarget(stops, copy, true)).toBe(close);
    expect(accountRevealTabTarget(stops, link, true)).toBeNull();
    expect(accountRevealTabTarget(stops, close, true)).toBeNull();
    expect(accountRevealTabTarget(stops, outside, true)).toBe(close);
    expect(accountRevealTabTarget([], copy, false)).toBeNull();
  });

  test("returns focus to the send button while it is still on the card", () => {
    const result = restoreFocus(
      "participation-submit-wish-1",
      {
        "participation-submit-wish-1": "button",
        "wish-title-wish-1": "heading",
      },
      storage,
    );

    expect(result.focused).toBe("button");
    expect(result.detailsOpen).toBe(true);
  });

  test("focuses the card title when the send button is gone", () => {
    const result = restoreFocus(
      "participation-submit-wish-1",
      {
        "wish-title-wish-1": "heading",
      },
      storage,
    );

    expect(result.focused).toBe("heading");
    expect(result.detailsOpen).toBe(false);
  });

  test("wires the public account dialog to the copy button and the send button", () => {
    const dialogSource = readFileSync(
      join(process.cwd(), "components/public-wishlist-toast-events.tsx"),
      "utf8",
    );
    const copySource = readFileSync(
      join(process.cwd(), "components/copy-account-number-button.tsx"),
      "utf8",
    );
    const submitSource = readFileSync(
      join(process.cwd(), "components/public-participation-submit-button.tsx"),
      "utf8",
    );
    const viewSource = readFileSync(
      join(process.cwd(), "components/public-wishlist-view.tsx"),
      "utf8",
    );

    expect(copySource).toContain("data-account-copy");
    expect(copySource).toContain("PUBLIC_WISHLIST_COPY.accountCopyLabel");
    expect(copySource).toContain("PUBLIC_WISHLIST_COPY.accountCopyCopied");
    expect(copySource).toContain("PUBLIC_WISHLIST_COPY.accountCopySuccess");
    expect(copySource).toContain("PUBLIC_WISHLIST_COPY.accountCopyError");
    expect(dialogSource).toContain('querySelector<HTMLButtonElement>("[data-account-copy]")?.focus()');
    expect(dialogSource).toContain('event.key === "Escape"');
    expect(dialogSource).toContain('event.key !== "Tab"');
    expect(dialogSource).toContain("accountRevealTabTarget");
    expect(dialogSource).toContain("restoreAccountRevealTriggerFocus");
    expect(submitSource).toContain("rememberAccountRevealTrigger");
    expect(viewSource).toContain("participationSubmitId(item.id)");
    expect(viewSource).toContain("wishTitleId(item.id)");
    expect(viewSource).toContain("PUBLIC_WISHLIST_COPY.participationSubmitCta");
  });
});

function restoreFocus(
  triggerId: string,
  present: Record<string, "button" | "heading">,
  storage: MemoryStorage,
): { focused: string | null; detailsOpen: boolean } {
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: storage,
  });
  rememberAccountRevealTrigger(triggerId);

  const details = { open: false };
  let focused: string | null = null;
  const originalDocument = globalThis.document;

  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      getElementById(id: string) {
        const kind = present[id];
        if (!kind) {
          return null;
        }

        return {
          focus() {
            focused = kind;
          },
          closest(selector: string) {
            return kind === "button" && selector === "details" ? details : null;
          },
        };
      },
    },
  });

  try {
    restoreAccountRevealTriggerFocus();
  } finally {
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: originalDocument,
    });
  }

  return { focused, detailsOpen: details.open };
}
