import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { parseLinkPreview } from "@/src/lib/link-preview/parse";
import { parseFetchableUrl } from "@/src/lib/link-preview/url-guard";

const MAX_HTML_LENGTH = 500_000;
const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 5_000;

export async function GET(request: Request): Promise<Response> {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const rawUrl = new URL(request.url).searchParams.get("url");
    const targetUrl = rawUrl ? parseFetchableUrl(rawUrl) : null;

    if (!targetUrl) {
      return NextResponse.json({ error: "invalid_url" }, { status: 400 });
    }

    const response = await fetchWithGuardedRedirects(targetUrl);

    if (!response || !response.ok) {
      return NextResponse.json({ error: "fetch_failed" }, { status: 502 });
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (!contentType.includes("text/html")) {
      return NextResponse.json({ error: "not_html" }, { status: 415 });
    }

    const html = await readCappedText(response, MAX_HTML_LENGTH);

    return NextResponse.json({
      preview: parseLinkPreview(html, response.url || targetUrl.toString()),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "fetch_failed" }, { status: 502 });
  }
}

// 악성 서버가 대용량 응답을 흘려보내 메모리를 고갈시키는 것을 막기 위해,
// 본문을 한꺼번에 읽지 않고 상한(maxLength)까지만 스트림으로 읽고 중단한다.
async function readCappedText(
  response: Response,
  maxLength: number,
): Promise<string> {
  const body = response.body;

  if (!body) {
    return (await response.text()).slice(0, maxLength);
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let result = "";

  try {
    while (result.length < maxLength) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      result += decoder.decode(value, { stream: true });
    }
  } finally {
    // 상한에 도달해 중단한 경우 남은 다운로드를 취소한다.
    await reader.cancel();
  }

  return result.slice(0, maxLength);
}

// 리다이렉트 목적지도 내부망일 수 있어 한 단계씩 검사하며 따라간다.
async function fetchWithGuardedRedirects(
  initialUrl: URL,
): Promise<Response | null> {
  let currentUrl: URL | null = initialUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS && currentUrl; hop += 1) {
    const response: Response = await fetch(currentUrl, {
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent":
          "Mozilla/5.0 (compatible; mwagotgosipeo-link-preview/1.0)",
      },
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (response.status < 300 || response.status >= 400) {
      return response;
    }

    const location: string | null = response.headers.get("location");
    currentUrl = location
      ? parseFetchableUrl(new URL(location, currentUrl).toString())
      : null;
  }

  return null;
}
