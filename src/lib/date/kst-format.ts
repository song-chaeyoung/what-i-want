// 서버(Vercel은 UTC) 기본 시간대와 무관하게 한국 시간으로 표시한다.
const KST_TIME_ZONE = "Asia/Seoul";

export function formatKstDate(value: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeZone: KST_TIME_ZONE,
  }).format(value);
}

export function formatKstDateTime(value: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: KST_TIME_ZONE,
  }).format(value);
}
