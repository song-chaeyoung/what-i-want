import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { PUBLIC_WISHLIST_COPY } from "@/src/lib/design/copy";

const participationRoutePath = join(
  process.cwd(),
  "app/api/public/wishlists/[slug]/participation/route.ts",
);
const participationActionsPath = join(
  process.cwd(),
  "app/wishlist/[slug]/actions.ts",
);

describe("public participation error-handling contract", () => {
  test("route maps malformed input to a 400 and unexpected failures to a 500", () => {
    const routeSource = readFileSync(participationRoutePath, "utf8");

    // Malformed body parsing must fail with 400, not fall through to a 500.
    expect(routeSource).toContain("await readParticipationInput(request)");
    expect(routeSource).toContain(
      'NextResponse.json({ error: "invalid_request" }, { status: 400 })',
    );

    // Unexpected (e.g. DB) failures are caught, logged, and surfaced without
    // leaking a raw 500 page to the visitor.
    expect(routeSource).toContain("} catch (error) {");
    expect(routeSource).toContain("console.error(error);");
    expect(routeSource).toContain(
      'NextResponse.json({ error: "unexpected" }, { status: 500 })',
    );
    expect(routeSource).toContain(
      'redirectToPublicPage(requestUrl, slug, "error", "unexpected")',
    );
  });

  test("server action redirects to an error toast instead of throwing to the boundary", () => {
    const actionsSource = readFileSync(participationActionsPath, "utf8");

    expect(actionsSource).toContain("} catch (error) {");
    expect(actionsSource).toContain("console.error(error);");
    expect(actionsSource).toContain(
      "redirect(`/wishlist/${slug}?error=unexpected`)",
    );

    // The happy-path redirect must stay outside the try so its NEXT_REDIRECT
    // control-flow throw is not swallowed by the catch.
    const catchIndex = actionsSource.indexOf("} catch (error) {");
    const sentRedirectIndex = actionsSource.indexOf(
      "redirect(`/wishlist/${slug}?sent=${result.kind}`)",
    );
    expect(catchIndex).toBeGreaterThan(-1);
    expect(sentRedirectIndex).toBeGreaterThan(catchIndex);
  });

  test("the unexpected toast key resolves to a user-facing message", () => {
    expect(PUBLIC_WISHLIST_COPY.participationErrors.unexpected).toBeTruthy();
  });
});
