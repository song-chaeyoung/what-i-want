export type LinkPreview = {
  title: string | null;
  imageUrl: string | null;
  price: number | null;
};

const titleMetaKeys = ["og:title", "twitter:title"] as const;
const imageMetaKeys = [
  "og:image:secure_url",
  "og:image",
  "twitter:image",
] as const;
const priceMetaKeys = ["og:price:amount", "product:price:amount"] as const;

export function parseLinkPreview(html: string, baseUrl: string): LinkPreview {
  const metaContents = collectMetaContents(html);

  return {
    title: pickTitle(metaContents, html),
    imageUrl: pickImageUrl(metaContents, baseUrl),
    price: pickPrice(metaContents),
  };
}

function collectMetaContents(html: string): Map<string, string> {
  const contents = new Map<string, string>();

  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const attributes = parseAttributes(tag);
    const key = (attributes.get("property") ?? attributes.get("name"))
      ?.trim()
      .toLowerCase();
    const content = attributes.get("content")?.trim();

    if (key && content && !contents.has(key)) {
      contents.set(key, content);
    }
  }

  return contents;
}

function parseAttributes(tag: string): Map<string, string> {
  const attributes = new Map<string, string>();
  const attributePattern = /([a-zA-Z][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;

  for (const match of tag.matchAll(attributePattern)) {
    attributes.set(match[1].toLowerCase(), match[2] ?? match[3] ?? "");
  }

  return attributes;
}

function pickTitle(
  metaContents: Map<string, string>,
  html: string,
): string | null {
  for (const key of titleMetaKeys) {
    const value = metaContents.get(key);

    if (value) {
      return decodeHtmlEntities(value);
    }
  }

  const titleTag = /<title[^>]*>([^<]*)<\/title>/i.exec(html);
  const titleText = titleTag?.[1]?.trim();

  return titleText ? decodeHtmlEntities(titleText) : null;
}

function pickImageUrl(
  metaContents: Map<string, string>,
  baseUrl: string,
): string | null {
  for (const key of imageMetaKeys) {
    const value = metaContents.get(key);

    if (!value) {
      continue;
    }

    try {
      const url = new URL(decodeHtmlEntities(value), baseUrl);

      if (url.protocol === "http:" || url.protocol === "https:") {
        return url.toString();
      }
    } catch {
      // 잘못된 이미지 주소는 건너뛰고 다음 후보를 확인한다.
    }
  }

  return null;
}

function pickPrice(metaContents: Map<string, string>): number | null {
  for (const key of priceMetaKeys) {
    const value = metaContents.get(key);

    if (!value) {
      continue;
    }

    const amount = Number(value.replace(/,/g, ""));

    if (Number.isFinite(amount) && amount > 0) {
      return Math.round(amount);
    }
  }

  return null;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 10)),
    )
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}
