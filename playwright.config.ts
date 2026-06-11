import { defineConfig, devices } from '@playwright/test';

/**
 * BASE_URL lets CI / docker-compose point the suite at an already-running app.
 * When it is unset (local dev), Playwright boots the demo app itself via the
 * webServer block below and shuts it down after the run.
 */
const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000';
const MANAGE_OWN_SERVER = !process.env.BASE_URL;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,   // fail the build if a stray test.only is committed
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',       // capture a full trace only when a test retries
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // API tests need no browser - they hit the REST API directly.
    { name: 'api', testMatch: /tests\/api\/.*\.spec\.ts/ },

    // UI tests run across all three engines.
    { name: 'chromium', testMatch: /tests\/ui\/.*\.spec\.ts/, use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  testMatch: /tests\/ui\/.*\.spec\.ts/, use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',   testMatch: /tests\/ui\/.*\.spec\.ts/, use: { ...devices['Desktop Safari'] } },
  ],

  webServer: MANAGE_OWN_SERVER
    ? {
        command: 'node app/server.js',
        url: 'http://127.0.0.1:3000/health',
        reuseExistingServer: !process.env.CI,
        timeout: 60_000,
      }
    : undefined,
});
