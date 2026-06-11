import { test as base, expect, APIRequestContext, Page, request } from '@playwright/test';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { VALID_USER } from '../utils/testData';
import { LoginPage } from '../pages/LoginPage';
import { TasksPage } from '../pages/TasksPage';

// The demo app is a plain Express instance (CommonJS, no type declarations).
// `require` returns `any`, so we narrow it to just the bit we use: `listen`.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const app = require('../app/server') as { listen(port: number): Server };

/**
 * Custom fixtures extend the base `test`. They remove repetition:
 *  - api          : an APIRequestContext that already carries a valid bearer token
 *  - authedPage   : a browser page already logged in (token seeded into localStorage)
 *  - loginPage / tasksPage : ready-made page objects
 *
 * `resetState` (autouse) puts the app back to a known seed before every test,
 * so tests stay independent and order-free even running in parallel.
 *
 * The demo app keeps its "database" in memory. Sharing one server across
 * parallel workers means one test's reset wipes another's data mid-flight, so
 * each worker instead boots its own copy of the app on an ephemeral port
 * (`workerServer`) and points `baseURL` at it. State is then isolated per
 * worker, and within a worker tests run serially - so the reset-before-each is
 * always safe.
 */
type Fixtures = {
  resetState: void;
  api: APIRequestContext;
  authedPage: Page;
  loginPage: LoginPage;
  tasksPage: TasksPage;
};

type WorkerFixtures = {
  workerServer: { baseURL: string };
};

async function getToken(baseURL: string): Promise<string> {
  const ctx = await request.newContext({ baseURL });
  const res = await ctx.post('/api/login', { data: VALID_USER });
  const body = await res.json();
  await ctx.dispose();
  return body.token;
}

export const test = base.extend<Fixtures, WorkerFixtures>({
  // One Express instance per worker on an OS-assigned port. When BASE_URL is set
  // (CI / docker pointing at an already-running app) we use that instead and
  // boot nothing. Worker-scoped: created once per worker, torn down at the end.
  workerServer: [
    async ({}, use) => {
      if (process.env.BASE_URL) {
        await use({ baseURL: process.env.BASE_URL });
        return;
      }
      const server = app.listen(0);
      await new Promise<void>((resolve) => server.once('listening', () => resolve()));
      const { port } = server.address() as AddressInfo;
      await use({ baseURL: `http://127.0.0.1:${port}` });
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
    { scope: 'worker' },
  ],

  // Point Playwright's built-in baseURL at this worker's own server.
  baseURL: async ({ workerServer }, use) => {
    await use(workerServer.baseURL);
  },

  // Reset the demo app to its seed before each test. autouse = runs automatically.
  resetState: [
    async ({ baseURL }, use) => {
      const ctx = await request.newContext({ baseURL });
      await ctx.post('/api/reset');
      await ctx.dispose();
      await use(undefined);
    },
    { auto: true },
  ],

  api: async ({ baseURL }, use) => {
    const token = await getToken(baseURL!);
    const ctx = await request.newContext({
      baseURL,
      extraHTTPHeaders: { Authorization: `Bearer ${token}` },
    });
    await use(ctx);
    await ctx.dispose();
  },

  authedPage: async ({ page, baseURL }, use) => {
    const token = await getToken(baseURL!);
    await page.goto('/');
    // Seed the token the same way the app does, then reload into the logged-in state.
    await page.evaluate(
      ([t, u]) => {
        localStorage.setItem('token', t);
        localStorage.setItem('user', u);
      },
      [token, VALID_USER.username],
    );
    await page.reload();
    await use(page);
  },

  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  tasksPage: async ({ page }, use) => use(new TasksPage(page)),
});

export { expect };
