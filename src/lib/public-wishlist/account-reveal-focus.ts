export const ACCOUNT_REVEAL_RETURN_FOCUS_KEY = "account-reveal-return-focus";

export function rememberAccountRevealTrigger(id: string): void {
  try {
    sessionStorage.setItem(ACCOUNT_REVEAL_RETURN_FOCUS_KEY, id);
  } catch {
    // sessionStorage can be blocked. Closing still works without a return target.
  }
}

export function takeAccountRevealTriggerId(): string | null {
  try {
    const id = sessionStorage.getItem(ACCOUNT_REVEAL_RETURN_FOCUS_KEY);
    sessionStorage.removeItem(ACCOUNT_REVEAL_RETURN_FOCUS_KEY);
    return id;
  } catch {
    return null;
  }
}

type AccountRevealTrigger = {
  focus: () => void;
  closest: (selector: string) => unknown;
};

export function openDetailsAndFocus(trigger: AccountRevealTrigger | null): void {
  if (!trigger) {
    return;
  }

  const details = trigger.closest("details");

  if (isDetailsElement(details)) {
    details.open = true;
  }

  trigger.focus();
}

export function restoreAccountRevealTriggerFocus(): void {
  if (typeof document === "undefined") {
    return;
  }

  const id = takeAccountRevealTriggerId();
  openDetailsAndFocus(id ? document.getElementById(id) : null);
}

export function accountRevealTabTarget<T>(
  tabStops: readonly T[],
  active: unknown,
  shiftKey: boolean,
): T | null {
  if (tabStops.length === 0) {
    return null;
  }

  const first = tabStops[0];
  const last = tabStops[tabStops.length - 1];
  const inside = tabStops.some((stop) => stop === active);

  if (shiftKey) {
    return !inside || active === first ? last : null;
  }

  return !inside || active === last ? first : null;
}

export function listDialogTabStops(root: ParentNode): HTMLElement[] {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute("disabled"));
}

function isDetailsElement(value: unknown): value is { open: boolean } {
  return (
    typeof value === "object" &&
    value !== null &&
    "open" in value &&
    typeof value.open === "boolean"
  );
}
