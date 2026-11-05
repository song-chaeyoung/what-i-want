import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { PrivateShareNotice } from "@/app/admin/share-public-link-button";
import { ADMIN_COPY } from "@/src/lib/design/copy";

describe("private wishlist share notice", () => {
  test("shows one line when the wishlist is private and nothing when it is public", () => {
    const privateHtml = renderToStaticMarkup(
      createElement(PrivateShareNotice, { visibility: "private" }),
    );
    const publicHtml = renderToStaticMarkup(
      createElement(PrivateShareNotice, { visibility: "public" }),
    );

    expect(privateHtml).toContain(ADMIN_COPY.privateShareNotice);
    expect(privateHtml).toContain("text-zinc-500");
    expect(publicHtml).toBe("");
  });

  test("keeps the share button on the dashboard and passes wishlist visibility", () => {
    const source = readFileSync(
      join(process.cwd(), "app/admin/page.tsx"),
      "utf8",
    );

    expect(source).toContain(
      "<SharePublicLinkButton slug={wishesResult.wishlist.slug} />",
    );
    expect(source).toContain(
      "<PrivateShareNotice visibility={wishesResult.wishlist.visibility} />",
    );
  });
});
