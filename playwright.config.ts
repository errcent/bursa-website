import { defineConfig } from "@playwright/test";
import path from "node:path";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "https://bursanalar.vercel.app";
const authFile = path.join(__dirname, "e2e/.auth/user.json");
const hasAuth = Boolean(
  process.env.PLAYWRIGHT_AUTH_EMAIL && process.env.PLAYWRIGHT_AUTH_PASSWORD,
);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "e2e/reports/html" }]],
  timeout: 90_000,
  expect: { timeout: 15_000 },
  outputDir: "e2e/test-results",
  use: {
    baseURL,
    locale: "id-ID",
    colorScheme: "dark",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    ignoreHTTPSErrors: true,
  },
  projects: [
    ...(hasAuth
      ? [
          {
            name: "setup",
            testMatch: /auth\.setup\.ts/,
          },
        ]
      : []),
    {
      name: "desktop",
      testMatch: /(visual-audit|gated-pages|performance-regression)\.spec\.ts/,
      dependencies: hasAuth ? ["setup"] : [],
      use: {
        viewport: { width: 1440, height: 900 },
        ...(hasAuth ? { storageState: authFile } : {}),
      },
    },
    {
      name: "mobile",
      testMatch: /(visual-audit|gated-pages|performance-regression)\.spec\.ts/,
      dependencies: hasAuth ? ["setup"] : [],
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        ...(hasAuth ? { storageState: authFile } : {}),
      },
    },
  ],
});
