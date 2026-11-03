export type WishStatus = "open" | "fulfilled" | "hidden" | "paused";

export const WISH_STATUS_LABELS = {
  open: "마음 모으는 중",
  fulfilled: "완료",
  hidden: "숨김",
  paused: "잠시 멈춤",
} satisfies Record<WishStatus, string>;

export function isWishComplete(status: WishStatus, progress: number): boolean {
  return status === "fulfilled" || progress >= 100;
}

export function getWishFundingProgress(
  fundedAmount: number,
  targetAmount: number | null,
): number {
  if (!targetAmount || targetAmount <= 0) {
    return 0;
  }

  return Math.min(100, Math.floor((fundedAmount / targetAmount) * 100));
}

export function getDisplayedWishStatus(
  status: WishStatus,
  progress: number,
): WishStatus {
  if (status === "paused" || status === "hidden") {
    return status;
  }

  if (isWishComplete(status, progress)) {
    return "fulfilled";
  }

  return status;
}

export function getWishStatusLabel(
  status: WishStatus,
  progress?: number,
): string {
  const displayedStatus =
    progress === undefined ? status : getDisplayedWishStatus(status, progress);

  return WISH_STATUS_LABELS[displayedStatus];
}
