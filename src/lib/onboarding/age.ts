import { getKstDateKey } from "@/src/lib/public-wishlist/birthday";

// 만 14세 미만은 법정대리인 동의가 필요하므로(개인정보 보호법 제22조의2) 가입을 받지 않는다.
const MINIMUM_SIGNUP_AGE = 14;

// 오늘(KST) 만 14세가 되는 가장 늦은 생일(YYYY-MM-DD). 날짜 입력의 max로도 쓴다.
// 생일 당일에 한 살 늘고, 2/29생은 평년 3/1에 늘어난다.
// 14년 전은 윤년이 아니므로 오늘이 2/29면 2/28로 맞춘다.
export function getLatestSignupBirthday(now: Date = new Date()): string {
  const today = getKstDateKey(now);
  const year = String(Number(today.slice(0, 4)) - MINIMUM_SIGNUP_AGE).padStart(
    4,
    "0",
  );
  const monthDay = today.slice(5) === "02-29" ? "02-28" : today.slice(5);

  return `${year}-${monthDay}`;
}

// 아직 오지 않은 날짜(KST)는 생일이 아니다. 나이 판정 전에 형식 오류로 거른다.
// birthday는 검증된 YYYY-MM-DD 문자열이어야 한다.
export function isFutureBirthday(
  birthday: string,
  now: Date = new Date(),
): boolean {
  return birthday > getKstDateKey(now);
}

// birthday는 검증된 YYYY-MM-DD 문자열이어야 한다.
export function isUnderMinimumSignupAge(
  birthday: string,
  now: Date = new Date(),
): boolean {
  return birthday > getLatestSignupBirthday(now);
}
