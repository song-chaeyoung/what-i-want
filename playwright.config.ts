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
    // 이미 떠 있는 서버를 재사용하면 이 env가 적용되지 않으므로 재사용하지 않는다.
    // 3200 포트가 사용 중이면 엉뚱한 DB로 테스트하는 대신 Playwright가 시작 단계에서 멈춘다.
    env: {
      DATABASE_URL: E2E_DATABASE_URL,
      ACCOUNT_ENCRYPTION_SECRET: E2E_ACCOUNT_ENCRYPTION_SECRET,
    },
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
