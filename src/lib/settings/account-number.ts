export const INVALID_ACCOUNT_NUMBER_MESSAGE =
  "계좌번호는 숫자와 하이픈(-)만 입력해 주세요.";

// HTML pattern attributes compile with the `v` flag. An unescaped hyphen after
// `\s` is a set-difference operator, so the browser ignores the pattern.
export const ACCOUNT_NUMBER_INPUT_PATTERN = "[0-9\\s\\-]*";
