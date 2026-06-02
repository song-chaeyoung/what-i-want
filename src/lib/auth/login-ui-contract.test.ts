import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const loginPagePath = join(process.cwd(), "app/login/page.tsx");

describe("login UI contract", () => {
  test("redirects authenticated users by onboarding state", () => {
    const source = readFileSync(loginPagePath, "utf8");

    expect(source).toContain('import { redirect } from "next/navigation";');
    expect(source).toContain('import { auth } from "@/auth";');
    expect(source).toContain(
      'import { getOnboardingState } from "@/src/lib/onboarding/repository";',
    );
    expect(source).toContain("export default async function LoginPage()");
    expect(source).toContain("const session = await auth();");
    expect(source).toContain("if (session?.user?.id)");
    expect(source).toContain(
      "const state = await getOnboardingState(session.user.id);",
    );
    expect(source).toContain('redirect("/onboarding");');
    expect(source).toContain('redirect("/admin");');
  });

  test("keeps social sign-in actions for unauthenticated users", () => {
    const source = readFileSync(loginPagePath, "utf8");

    expect(source).toContain("signInWithGoogle");
    expect(source).toContain("signInWithKakao");
  });
});
