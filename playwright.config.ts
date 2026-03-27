import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
import { AUTH_STORAGE_STATE, E2E_BASE_URL, hasAuthCredentials } from "./tests/e2e/helpers/constants";

loadEnvConfig(process.cwd());

const isCI = Boolean(process.env.CI);
const useDevServer = process.env.PLAYWRIGHT_SERVER_MODE === "dev";
const authEnabled = hasAuthCredentials();
const baseURL = E2E_BASE_URL;
const serverPort = new URL(baseURL).port || "3002";
const publicTestMatch = /tests\/e2e\/public\/.*\.spec\.ts/;
const apiTestMatch = /tests\/e2e\/api\/.*\.spec\.ts/;
const authenticatedTestMatch = /tests\/e2e\/authenticated\/.*\.spec\.ts/;

const publicProjects = [
  {
    name: "public-chromium",
    testMatch: publicTestMatch,
    use: { ...devices["Desktop Chrome"] },
  },
  {
    name: "public-firefox",
    testMatch: publicTestMatch,
    use: { ...devices["Desktop Firefox"] },
  },
  {
    name: "public-webkit",
    testMatch: publicTestMatch,
    use: { ...devices["Desktop Safari"] },
  },
  {
    name: "mobile-chrome",
    testMatch: publicTestMatch,
    use: { ...devices["Pixel 7"] },
  },
  {
    name: "mobile-safari",
    testMatch: publicTestMatch,
    use: { ...devices["iPhone 15"] },
  },
  {
    name: "api",
    testMatch: apiTestMatch,
    use: { ...devices["Desktop Chrome"] },
  },
] as const;

const authenticatedProjects = authEnabled
  ? [
      {
        name: "setup-auth",
        testMatch: /tests\/e2e\/setup\/auth\.setup\.ts/,
        use: { ...devices["Desktop Chrome"] },
      },
      {
        name: "auth-chromium",
        dependencies: ["setup-auth"],
        testMatch: authenticatedTestMatch,
        use: {
          ...devices["Desktop Chrome"],
          storageState: AUTH_STORAGE_STATE,
        },
      },
      {
        name: "auth-firefox",
        dependencies: ["setup-auth"],
        testMatch: authenticatedTestMatch,
        use: {
          ...devices["Desktop Firefox"],
          storageState: AUTH_STORAGE_STATE,
        },
      },
      {
        name: "auth-webkit",
        dependencies: ["setup-auth"],
        testMatch: authenticatedTestMatch,
        use: {
          ...devices["Desktop Safari"],
          storageState: AUTH_STORAGE_STATE,
        },
      },
      {
        name: "auth-mobile-chrome",
        dependencies: ["setup-auth"],
        testMatch: authenticatedTestMatch,
        use: {
          ...devices["Pixel 7"],
          storageState: AUTH_STORAGE_STATE,
        },
      },
      {
        name: "auth-mobile-safari",
        dependencies: ["setup-auth"],
        testMatch: authenticatedTestMatch,
        use: {
          ...devices["iPhone 15"],
          storageState: AUTH_STORAGE_STATE,
        },
      },
    ]
  : [];

export default defineConfig({
  testDir: path.join(process.cwd(), "tests", "e2e"),
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 4 : 4,
  timeout: 90_000,
  expect: {
    timeout: 15_000,
  },
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["junit", { outputFile: "test-results/e2e/junit.xml" }],
    ["json", { outputFile: "test-results/e2e/results.json" }],
  ],
  outputDir: "test-results/e2e/artifacts",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 20_000,
    navigationTimeout: 30_000,
    ignoreHTTPSErrors: true,
    testIdAttribute: "data-testid",
  },
  webServer: {
    command: useDevServer
      ? `npx next dev --port ${serverPort}`
      : `npm run build && npx next start --port ${serverPort}`,
    url: baseURL,
    timeout: useDevServer ? 180_000 : 300_000,
    reuseExistingServer: useDevServer && !isCI,
    stdout: "pipe",
    stderr: "pipe",
  },
  projects: [...publicProjects, ...authenticatedProjects],
});
