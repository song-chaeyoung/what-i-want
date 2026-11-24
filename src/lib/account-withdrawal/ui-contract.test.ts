import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

describe("account withdrawal UI contract", () => {
  test("places withdrawal outside the logout form and confirms before posting", () => {
    const pageSource = readFileSync(
      join(process.cwd(), "app/admin/settings/page.tsx"),
      "utf8",
    );
    const formSource = readFileSync(
      join(process.cwd(), "app/admin/settings/withdraw-account-form.tsx"),
      "utf8",
    );
    const routeSource = readFileSync(
      join(process.cwd(), "app/api/admin/account/withdraw/route.ts"),
      "utf8",
    );
    const homeSource = readFileSync(join(process.cwd(), "app/page.tsx"), "utf8");
    const toastSource = readFileSync(
      join(process.cwd(), "components/withdrawn-toast.tsx"),
      "utf8",
    );

    expect(pageSource).toContain("title={WITHDRAWAL_COPY.sectionTitle}");
    expect(pageSource).toContain(
      "description={WITHDRAWAL_COPY.sectionDescription}",
    );
    expect(pageSource).toContain('formId="withdraw-account-form"');
    expect(pageSource).toContain("{WITHDRAWAL_COPY.button}");
    expect(pageSource).toContain("WITHDRAWAL_COPY.confirm.title");
    expect(pageSource).toContain("<ConfirmDialog");
    expect(pageSource.indexOf('title="계정"')).toBeLessThan(
      pageSource.indexOf("title={WITHDRAWAL_COPY.sectionTitle}"),
    );
    expect(pageSource.indexOf("</SettingsSection>")).toBeLessThan(
      pageSource.lastIndexOf("<WithdrawAccountForm />"),
    );
    expect(formSource).toContain('id="withdraw-account-form"');
    expect(formSource).toContain('action="/api/admin/account/withdraw"');
    expect(formSource).not.toContain("window.confirm");
    expect(formSource).not.toContain("<Button");
    expect(routeSource).toContain("withdrawAccount(");
    expect(routeSource).toContain("session.user.id");
    expect(routeSource).toContain('signOut({ redirectTo: "/?withdrawn=1" })');
    expect(routeSource).toContain('"withdraw_failed"');
    expect(routeSource).not.toContain('getFormString(formData, "userId")');
    expect(homeSource).toContain("<WithdrawnToast />");
    expect(toastSource).toContain("toast.success(WITHDRAWAL_COPY.success)");
    expect(toastSource).toContain('searchParams.get("withdrawn") !== "1"');
    expect(toastSource).toContain('nextParams.delete("withdrawn")');
    expect(toastSource).toContain("router.replace(");
  });
});
