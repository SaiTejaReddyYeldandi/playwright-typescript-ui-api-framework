import { defineConfig, devices } from '@playwright/test';

/**
 * Each worker boots its own copy of the demo app on an ephemeral port (see the
 * `workerServer` fixture), so the suite needs no global webServer and no fixed
 * port. Set BASE_URL to point the suite at an already-running app instead
 * (CI / docker-compose) - the fixture honours it and boots nothing.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,   // fail the build if a stray test.only is committed
  retries: process.env.CI ? 1 : 0,
  // With BASE_URL set, every worker shares one external app (Docker/staging), so
  // there is no per-worker isolation - run serially to keep reset-before-each
  // deterministic. Otherwise each worker boots its own app and runs in parallel.
  workers: process.env.BASE_URL ? 1 : process.env.CI ? 2 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
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
});
