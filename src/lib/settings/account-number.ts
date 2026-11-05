// HTML pattern attributes compile with the `v` flag. An unescaped hyphen after
// `\s` is a set-difference operator, so the browser ignores the pattern.
export const ACCOUNT_NUMBER_INPUT_PATTERN = "[0-9\\s\\-]*";
