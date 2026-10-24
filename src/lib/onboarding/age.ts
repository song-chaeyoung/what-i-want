import { getKstDateKey } from "@/src/lib/public-wishlist/birthday";

// 만 14세 미만은 법정대리인 동의가 필요하므로(개인정보 보호법 제22조의2) 가입을 받지 않는다.
const MINIMUM_SIGNUP_AGE = 14;

// 만 나이(KST 기준). 생일 당일에 한 살 늘고, 2/29생은 평년 3/1에 늘어난다.
// birthday는 검증된 YYYY-MM-DD 문자열이어야 한다.
export function isUnderMinimumSignupAge(
  birthday: string,
  now: Date = new Date(),
): boolean {
  const today = getKstDateKey(now);
  const age = Number(today.slice(0, 4)) - Number(birthday.slice(0, 4));
  const ageInYears = today.slice(5) < birthday.slice(5) ? age - 1 : age;

  return ageInYears < MINIMUM_SIGNUP_AGE;
}
