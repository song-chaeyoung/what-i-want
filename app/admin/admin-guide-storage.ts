const ADMIN_GUIDE_SEEN_KEY = "mwagotgo:admin-guide-seen";

// The guide is a purely informational modal, so its "already seen" flag lives in
// the browser rather than the database — per-device is acceptable here, and it
// keeps the feature free of schema, API, and server round-trip cost. Reads and
// writes are guarded because Safari private mode throws on storage access; a
// failure simply means the guide shows again, which is harmless.
export function hasSeenAdminGuide(storage: Storage = localStorage): boolean {
  try {
    return storage.getItem(ADMIN_GUIDE_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function markAdminGuideSeen(storage: Storage = localStorage): void {
  try {
    storage.setItem(ADMIN_GUIDE_SEEN_KEY, "1");
  } catch {
    // Storage unavailable (private mode / disabled) — accept re-showing the guide.
  }
}
