// 상품 링크 미리보기는 서버가 대신 URL을 열어보므로,
// 내부망을 향한 요청(SSRF)을 막기 위해 호스트를 검사한다.
// 주의: 이 가드는 호스트 "문자열"만 검사하므로, 공개 도메인이 내부 IP로
// resolve되는 DNS 리바인딩(예: 127.0.0.1.nip.io)은 막지 못한다. 완전한
// 방어는 호스트명을 직접 resolve해 IP를 검사·고정(pin)하는 방식이 필요하다.
export function parseFetchableUrl(value: string): URL | null {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return null;
  }

  if (isPrivateHostname(url.hostname)) {
    return null;
  }

  return url;
}

function isPrivateHostname(hostname: string): boolean {
  // 런타임에 따라 IPv6 호스트명이 대괄호를 포함할 수 있다. (예: "[::1]")
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (
    normalized === "" ||
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal")
  ) {
    return true;
  }

  if (isPrivateIpv4(normalized)) {
    return true;
  }

  return isPrivateIpv6(normalized);
}

function isPrivateIpv4(hostname: string): boolean {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostname);

  if (!match) {
    return false;
  }

  const [first, second] = [Number(match[1]), Number(match[2])];

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168)
  );
}

function isPrivateIpv6(hostname: string): boolean {
  if (!hostname.includes(":")) {
    return false;
  }

  // IPv4-매핑 IPv6(예: ::ffff:127.0.0.1)는 그대로 내부 IPv4로 연결되므로
  // 어떤 대상이든 차단한다. Node의 URL이 ::ffff:7f00:1 형태로 정규화해도
  // 프리픽스는 유지되어 이 검사에 걸린다.
  return (
    hostname === "::" ||
    hostname === "::1" ||
    hostname.startsWith("fc") ||
    hostname.startsWith("fd") ||
    hostname.startsWith("fe80") ||
    hostname.startsWith("::ffff:")
  );
}
