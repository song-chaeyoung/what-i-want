// 58px 제목이 왼쪽 카드(패딩을 뺀 약 600px)에 한 줄로 들어가는 길이.
export const TITLE_WORD_BREAK_LIMIT = 10;

export function wishlistTitleWordBreak(title: string): "keep-all" | "break-all" {
  const words = title.split(/\s+/).filter((word) => word.length > 0);
  const everyWordFits = words.every((word) => word.length <= TITLE_WORD_BREAK_LIMIT);

  return everyWordFits ? "keep-all" : "break-all";
}
