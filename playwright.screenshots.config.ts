import { defineConfig } from "@playwright/test";
import {
  BASE_URL,
  SCREENSHOT_PORT,
  resolveDatabaseUrl,
  screenshotServerEnv,
} from "./tests/screenshots/fixtures";

const databaseUrl = resolveDatabaseUrl();

export default defineConfig({
  testDir: "./tests/screenshots",
  testMatch: "capture.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "line",
  timeout: 120_000,
  globalSetup: "./tests/screenshots/global-setup.ts",
  outputDir: "test-results/screenshots",
  use: {
    baseURL: BASE_URL,
    trace: "off",
    screenshot: "off",
    video: "off",
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    colorScheme: "light",
    reducedMotion: "reduce",
    deviceScaleFactor: 1,
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
      },
    },
  ],
  webServer: {
    command: `pnpm dev --port ${SCREENSHOT_PORT}`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 180_000,
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...screenshotServerEnv(databaseUrl),
      NODE_OPTIONS: [
        process.env.NODE_OPTIONS,
        `--require ${process.cwd()}/scripts/screenshot-freeze-clock.cjs`,
      ]
        .filter(Boolean)
        .join(" "),
    },
  },
});
