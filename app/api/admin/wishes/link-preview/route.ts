import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchPreviewPage } from "@/src/lib/link-preview/fetch-page";
import { parseLinkPreview } from "@/src/lib/link-preview/parse";
import { parseFetchableUrl } from "@/src/lib/link-preview/url-guard";

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

    const page = await fetchPreviewPage(targetUrl);

    if (!page || page.status < 200 || page.status >= 300) {
      return NextResponse.json({ error: "fetch_failed" }, { status: 502 });
    }

    if (!page.contentType.includes("text/html")) {
      return NextResponse.json({ error: "not_html" }, { status: 415 });
    }

    return NextResponse.json({
      preview: parseLinkPreview(page.html, page.url),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "fetch_failed" }, { status: 502 });
  }
}
