import { describe, expect, test } from "vitest";
import { parseLinkPreview } from "./parse";

const baseUrl = "https://shop.example.com/products/1";

describe("parseLinkPreview", () => {
  test("reads title, image, and price from Open Graph meta tags", () => {
    const html = `
      <html><head>
        <meta property="og:title" content="무선 헤드폰" />
        <meta property="og:image" content="https://cdn.example.com/headphone.jpg" />
        <meta property="og:price:amount" content="45000" />
      </head></html>
    `;

    expect(parseLinkPreview(html, baseUrl)).toEqual({
      title: "무선 헤드폰",
      imageUrl: "https://cdn.example.com/headphone.jpg",
      price: 45000,
    });
  });

  test("falls back to twitter meta and the title tag", () => {
    const html = `
      <html><head>
        <title>케이크 | 예시 상점</title>
        <meta name="twitter:image" content="/images/cake.png" />
      </head></html>
    `;

    expect(parseLinkPreview(html, baseUrl)).toEqual({
      title: "케이크 | 예시 상점",
      imageUrl: "https://shop.example.com/images/cake.png",
      price: null,
    });
  });

  test("handles reversed attribute order and single quotes", () => {
    const html = `<meta content='선물 상자' property='og:title'>`;

    expect(parseLinkPreview(html, baseUrl).title).toBe("선물 상자");
  });

  test("decodes HTML entities in the title", () => {
    const html = `<meta property="og:title" content="Tom &amp; Jerry &#39;23" />`;

    expect(parseLinkPreview(html, baseUrl).title).toBe("Tom & Jerry '23");
  });

  test("ignores non-http image URLs and invalid prices", () => {
    const html = `
      <meta property="og:image" content="javascript:alert(1)" />
      <meta property="og:price:amount" content="무료" />
    `;

    expect(parseLinkPreview(html, baseUrl)).toEqual({
      title: null,
      imageUrl: null,
      price: null,
    });
  });

  test("rounds decimal prices and strips thousands separators", () => {
    const html = `<meta property="product:price:amount" content="45,000.00" />`;

    expect(parseLinkPreview(html, baseUrl).price).toBe(45000);
  });

  test("returns nulls for pages without any preview data", () => {
    expect(parseLinkPreview("<html><body>hi</body></html>", baseUrl)).toEqual({
      title: null,
      imageUrl: null,
      price: null,
    });
  });
});
