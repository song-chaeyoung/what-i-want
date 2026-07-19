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
    .replace(/&#x([0-9a-fA-F]+);/g, (match, hex: string) =>
      fromCodePointSafe(match, Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (match, code: string) =>
      fromCodePointSafe(match, Number.parseInt(code, 10)),
    )
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

// 유효한 유니코드 코드 포인트 범위를 벗어나면 String.fromCodePoint가 RangeError를
// 던지므로, 그런 잘못된 엔티티는 디코딩하지 않고 원문을 그대로 둔다.
function fromCodePointSafe(original: string, codePoint: number): string {
  if (!Number.isInteger(codePoint) || codePoint < 0 || codePoint > 0x10ffff) {
    return original;
  }

  return String.fromCodePoint(codePoint);
}
