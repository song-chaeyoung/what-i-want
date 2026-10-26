"use client";

import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

// 쿼리스트링(예: /login?notice=under_minimum_age)은 방문 통계에 필요 없으므로 보내지 않는다.
// beforeSend는 함수라 서버 컴포넌트인 루트 레이아웃에서 바로 넘길 수 없어 클라이언트 래퍼로 둔다.
function stripQuery(event: BeforeSendEvent): BeforeSendEvent {
  const url = new URL(event.url);
  url.search = "";
  return { ...event, url: url.toString() };
}

export function SiteAnalytics() {
  return <Analytics beforeSend={stripQuery} />;
}
