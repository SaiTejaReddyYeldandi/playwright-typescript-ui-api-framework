import { test as base, expect, APIRequestContext, Page, request } from '@playwright/test';
import { VALID_USER } from '../utils/testData';
import { LoginPage } from '../pages/LoginPage';
import { TasksPage } from '../pages/TasksPage';

/**
 * Custom fixtures extend the base `test`. They remove repetition:
 *  - api          : an APIRequestContext that already carries a valid bearer token
 *  - authedPage   : a browser page already logged in (token seeded into localStorage)
 *  - loginPage / tasksPage : ready-made page objects
 *
 * `resetState` (autouse) puts the app back to a known seed before every test,
 * so tests stay independent and order-free even running in parallel.
 */
type Fixtures = {
  resetState: void;
  api: APIRequestContext;
  authedPage: Page;
  loginPage: LoginPage;
  tasksPage: TasksPage;
};

async function getToken(baseURL: string): Promise<string> {
  const ctx = await request.newContext({ baseURL });
  const res = await ctx.post('/api/login', { data: VALID_USER });
  const body = await res.json();
  await ctx.dispose();
  return body.token;
}

export const test = base.extend<Fixtures>({
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
