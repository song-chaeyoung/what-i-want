export type WishStatus = "open" | "fulfilled" | "hidden" | "paused";

export const WISH_STATUS_LABELS = {
  open: "모으는 중",
  fulfilled: "완료",
  hidden: "숨김",
  paused: "일시중지",
} satisfies Record<WishStatus, string>;

export function isWishComplete(status: WishStatus, progress: number): boolean {
  return status === "fulfilled" || progress >= 100;
}

export function getWishStatusLabel(status: WishStatus): string {
  return WISH_STATUS_LABELS[status];
}
