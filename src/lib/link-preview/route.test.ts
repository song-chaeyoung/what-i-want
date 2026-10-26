import { beforeEach, describe, expect, test, vi } from "vitest";
import { GET } from "@/app/api/admin/wishes/link-preview/route";

const { auth, fetchPreviewPage } = vi.hoisted(() => ({
  auth: vi.fn(),
  fetchPreviewPage: vi.fn(),
}));
vi.mock("@/auth", () => ({ auth }));
vi.mock("./fetch-page", () => ({ fetchPreviewPage }));

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ user: { id: "owner" } });
});

function previewRequest(url: string): Request {
  return new Request(`https://wishlist.example/api/admin/wishes/link-preview?${
    new URLSearchParams({ url })
  }`);
}

describe("link preview route", () => {
  test("requires authentication before opening a URL", async () => {
    auth.mockResolvedValue(null);
    const response = await GET(previewRequest("https://shop.example/item"));
    expect(response.status).toBe(401);
    expect(fetchPreviewPage).not.toHaveBeenCalled();
  });

  test("rejects private literals before fetching", async () => {
    const response = await GET(previewRequest("http://127.0.0.1/admin"));
    expect(response.status).toBe(400);
    expect(fetchPreviewPage).not.toHaveBeenCalled();
  });

  test("returns fetch_failed for blocked DNS or redirects", async () => {
    fetchPreviewPage.mockResolvedValue(null);
    const response = await GET(previewRequest("https://shop.example/item"));
    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: "fetch_failed" });
  });

  test("keeps the non-HTML response error", async () => {
    fetchPreviewPage.mockResolvedValue({ status: 200, contentType: "application/json" });
    const response = await GET(previewRequest("https://shop.example/item"));
    expect(response.status).toBe(415);
    expect(await response.json()).toEqual({ error: "not_html" });
  });

  test("parses HTML against the final guarded URL after redirects", async () => {
    fetchPreviewPage.mockResolvedValue({
      status: 200,
      contentType: "text/html; charset=utf-8",
      html: '<title>Gift</title><meta property="og:image" content="photo.jpg">',
      url: "https://shop.example/products/gift",
    });
    const response = await GET(previewRequest("https://shop.example/item"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      preview: { title: "Gift", imageUrl: "https://shop.example/products/photo.jpg", price: null },
    });
  });
});
