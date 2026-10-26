// 서버(Vercel은 UTC) 기본 시간대와 무관하게 한국 시간으로 표시한다.
const KST_TIME_ZONE = "Asia/Seoul";

const kstDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeZone: KST_TIME_ZONE,
});

const kstDateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: KST_TIME_ZONE,
});

export function formatKstDate(value: Date): string {
  return kstDateFormatter.format(value);
}

export function formatKstDateTime(value: Date): string {
  return kstDateTimeFormatter.format(value);
}
