import { defineConfig, devices } from "@playwright/test";

// 3000(기본 dev), 3100(dev-age-gate)과 겹치지 않도록 E2E 전용 포트를 쓴다.
const PORT = 3200;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `pnpm dev --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
