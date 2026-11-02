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

export function getWishStatusLabel(
  status: WishStatus,
  progress?: number,
): string {
  if (
    progress !== undefined &&
    status !== "paused" &&
    status !== "hidden" &&
    isWishComplete(status, progress)
  ) {
    return WISH_STATUS_LABELS.fulfilled;
  }

  return WISH_STATUS_LABELS[status];
}
