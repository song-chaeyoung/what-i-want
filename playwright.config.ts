import { defineConfig, devices } from "@playwright/test";
import {
  E2E_ACCOUNT_ENCRYPTION_SECRET,
  E2E_DATABASE_URL,
} from "./tests/support/e2e-db";

// 3000(기본 dev), 3100(dev-age-gate)과 겹치지 않도록 E2E 전용 포트를 쓴다.
const PORT = 3200;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  globalSetup: "./tests/global-setup.ts",
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
    // Next는 process.env를 .env.local보다 먼저 읽으므로 DB와 계좌 암호화 키만 E2E 값으로 바꾼다.
    // 이미 떠 있는 서버를 재사용하면 이 env가 적용되지 않으니, 3200 포트 서버는 Playwright가 띄우게 둔다.
    env: {
      DATABASE_URL: E2E_DATABASE_URL,
      ACCOUNT_ENCRYPTION_SECRET: E2E_ACCOUNT_ENCRYPTION_SECRET,
    },
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
