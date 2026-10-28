import { expect, test } from "@playwright/test";

test("unauthenticated onboarding submissions reach the login page", async ({
  request,
}) => {
  const response = await request.post("/api/onboarding", {
    form: { displayName: "온보딩 검증", ageConfirmed: "on" },
  });

  expect(response.status()).toBe(200);
  expect(new URL(response.url()).pathname).toBe("/login");
  expect(await response.text()).toContain("Google로 계속하기");
});
