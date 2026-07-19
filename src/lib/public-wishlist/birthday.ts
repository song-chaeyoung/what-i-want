const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

type MonthDay = {
  month: number;
  day: number;
};

export function parseBirthday(value: string): MonthDay | null {
  const match = /^\d{4}-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const month = Number(match[1]);
  const day = Number(match[2]);

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  return { month, day };
}

export function getDaysUntilBirthday(
  birthday: string,
  now: Date = new Date(),
): number | null {
  const parsed = parseBirthday(birthday);

  if (!parsed) {
    return null;
  }

  const kstNow = new Date(now.getTime() + KST_OFFSET_MS);
  const todayStart = Date.UTC(
    kstNow.getUTCFullYear(),
    kstNow.getUTCMonth(),
    kstNow.getUTCDate(),
  );
  const thisYear = birthdayStart(kstNow.getUTCFullYear(), parsed);
  const target =
    thisYear >= todayStart
      ? thisYear
      : birthdayStart(kstNow.getUTCFullYear() + 1, parsed);

  return Math.round((target - todayStart) / DAY_MS);
}

// 2/29 출생은 평년에 2/28로 축하한다.
function birthdayStart(year: number, monthDay: MonthDay): number {
  const lastDayOfMonth = new Date(
    Date.UTC(year, monthDay.month, 0),
  ).getUTCDate();

  return Date.UTC(year, monthDay.month - 1, Math.min(monthDay.day, lastDayOfMonth));
}

export function formatBirthdayBadge(
  birthday: string,
  now: Date = new Date(),
): string | null {
  const parsed = parseBirthday(birthday);
  const days = getDaysUntilBirthday(birthday, now);

  if (!parsed || days === null) {
    return null;
  }

  const dday = days === 0 ? "D-DAY" : `D-${days}`;

  return `${parsed.month}월 ${parsed.day}일 · ${dday}`;
}
