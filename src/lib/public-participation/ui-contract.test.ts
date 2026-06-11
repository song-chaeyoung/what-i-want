import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const publicPagePath = join(process.cwd(), "app/wishlist/[slug]/page.tsx");
const publicViewPath = join(process.cwd(), "components/public-wishlist-view.tsx");
const publicSubmitButtonPath = join(
  process.cwd(),
  "components/public-participation-submit-button.tsx",
);
const publicToastEventsPath = join(
  process.cwd(),
  "components/public-wishlist-toast-events.tsx",
);
const participationActionsPath = join(
  process.cwd(),
  "app/wishlist/[slug]/actions.ts",
);
const adminMessagesPagePath = join(process.cwd(), "app/admin/messages/page.tsx");
const adminLayoutPath = join(process.cwd(), "app/admin/layout.tsx");
const adminShellNavPath = join(process.cwd(), "app/admin/admin-shell-nav.tsx");

describe("public participation UI contract", () => {
  test("renders a public participation form on the public wishlist page", () => {
    const pageSource = readFileSync(publicPagePath, "utf8");
    const viewSource = readFileSync(publicViewPath, "utf8");

    expect(pageSource).toContain("PublicWishlistToastEvents");
    expect(viewSource).toContain("PUBLIC_WISHLIST_COPY.participationTitle");
    expect(viewSource).toContain("participation");
    expect(viewSource).toContain('name="wishItemId"');
    expect(viewSource).toContain('name="amount"');
    expect(viewSource).toContain('name="senderName"');
    expect(viewSource).toContain('name="body"');
  });

  test("disables public participation submit buttons while a form is pending", () => {
    const viewSource = readFileSync(publicViewPath, "utf8");
    const buttonSource = readFileSync(publicSubmitButtonPath, "utf8");

    expect(viewSource).toContain("PublicParticipationSubmitButton");
    expect(buttonSource).toContain('"use client";');
    expect(buttonSource).toContain('import { useFormStatus } from "react-dom";');
    expect(buttonSource).toContain("const { pending } = useFormStatus();");
    expect(buttonSource).toContain("disabled={pending}");
  });

  test("submits participation forms through a server action", () => {
    const viewSource = readFileSync(publicViewPath, "utf8");
    const actionsSource = readFileSync(participationActionsPath, "utf8");

    expect(actionsSource).toContain('"use server";');
    expect(actionsSource).toContain("checkPublicParticipationRateLimit");
    expect(actionsSource).toContain("submitPublicParticipation");
    expect(viewSource).toContain("submitParticipationAction.bind(null, slug)");
  });

  test("turns public participation query feedback into toasts and cleans the URL", () => {
    const pageSource = readFileSync(publicPagePath, "utf8");

    expect(existsSync(publicToastEventsPath)).toBe(true);

    const toastSource = readFileSync(publicToastEventsPath, "utf8");

    expect(pageSource).toContain('import { Suspense } from "react";');
    expect(pageSource).toContain(
      'import { PublicWishlistToastEvents } from "@/components/public-wishlist-toast-events";',
    );
    expect(pageSource).toContain("<Suspense fallback={null}>");
    expect(pageSource).toContain(
      "<PublicWishlistToastEvents account={result.account} />",
    );
    expect(pageSource).not.toContain("sent={query.sent");
    expect(pageSource).not.toContain("errorMessage={query.error");

    expect(toastSource).toMatch(/^"use client";/);
    expect(toastSource).toContain(
      'import { usePathname, useRouter, useSearchParams } from "next/navigation";',
    );
    expect(toastSource).toContain('import { toast } from "sonner";');
    expect(toastSource).toContain('sent === "funding"');
    expect(toastSource).toContain("PUBLIC_WISHLIST_COPY.participationSuccess");
    expect(toastSource).toContain("PUBLIC_WISHLIST_COPY.messageSuccess");
    expect(toastSource).toContain("getParticipationErrorMessage");
    expect(toastSource).toContain('nextParams.delete("sent");');
    expect(toastSource).toContain('nextParams.delete("error");');
    expect(toastSource).toContain("router.replace(nextUrl, { scroll: false });");
  });

  test("does not render public participation feedback as inline notices", () => {
    const viewSource = readFileSync(publicViewPath, "utf8");

    expect(viewSource).not.toContain("sentKind");
    expect(viewSource).not.toContain("participationSuccess");
    expect(viewSource).not.toContain("messageSuccess");
    expect(viewSource).not.toContain("errorMessage");
  });

  test("includes an idempotency token in participation forms", () => {
    const viewSource = readFileSync(publicViewPath, "utf8");

    expect(viewSource).toContain('name="clientRequestId"');
    expect(viewSource).toContain("crypto.randomUUID()");
  });

  test("adds an admin messages page and navigation link", () => {
    const pageSource = readFileSync(adminMessagesPagePath, "utf8");
    const layoutSource = readFileSync(adminLayoutPath, "utf8");
    const navSource = readFileSync(adminShellNavPath, "utf8");

    expect(pageSource).toContain("listAdminMessages");
    expect(pageSource).toContain("DrizzleAdminMessagesRepository");
    expect(navSource).toContain("메시지함");
    expect(layoutSource).toContain("<AdminShellNav");
    expect(navSource).toContain('href: "/admin/messages"');
  });
});
