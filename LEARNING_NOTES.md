# Learning Notes — Playwright + TypeScript in a day

A study path through this repo, written for someone who already knows QA and automation
(Selenium/Java, API testing, CI) and is converting that knowledge to the Playwright + TS
+ Node stack. Roughly a 12-hour plan. Don't just read it — change a line, run it, see it
break, fix it. That's what makes it stick in an interview.

## What we built (summary)

One framework that tests the same app two ways — REST API and browser UI — in CI, against a
small Dockerised Express app. Page Object Model, custom fixtures, cross-browser projects,
data-driven tests, a CI quality gate, and a traceability matrix. Verified locally: **8 API
tests and 11 Chromium UI tests passing.**

---

## Hour 1–2 — The app under test, and the tooling

- Read `app/server.js`. It's a tiny Express REST API (auth + task CRUD) with deliberate
  behaviours QA cares about: 401 (no/bad token), 422 (validation), 404 (missing), 201/204.
- Read `app/public/index.html`. Note every interactive element has a `data-testid`. **This is
  the habit to carry into real projects** — stable hooks beat brittle CSS/text selectors.
- Concepts to lock in: Playwright bundles its own browsers (`npx playwright install`); the
  test runner is `@playwright/test`; config lives in `playwright.config.ts`.

## Hour 3–4 — API testing (your fastest win)

- Read `tests/api/auth.api.spec.ts` and `tests/api/tasks.api.spec.ts`.
- Key API: `request.newContext({ baseURL })` → `.get/.post/.put/.delete`, then
  `res.status()` and `await res.json()`. Compare to Java RestAssured — same ideas, less
  boilerplate.
- The lifecycle test (create → read → update → delete → confirm 404) is the pattern
  interviewers love because it proves the resource really changed state.
- Run it: `npm run test:api`. Break it on purpose — change an expected `201` to `200` and
  watch the failure output.

## Hour 5–6 — Page Object Model

- Read `pages/LoginPage.ts` and `pages/TasksPage.ts`.
- A page object holds **locators** (declared once in the constructor) and **actions**
  (methods). Specs call methods; they never see a raw selector. Same principle as your
  Java/Selenium POM, but with Playwright `Locator`s that auto-wait — no explicit waits, no
  `Thread.sleep`.
- `getByTestId`, `getByRole`, and filtering (`locator('.task', { hasText: title })`) are the
  three selector tools to know.

## Hour 7–8 — Fixtures (the part that signals "intermediate")

- Read `fixtures/test-fixtures.ts`. This is the highest-value file to be able to explain.
- `base.extend<Fixtures>({ ... })` creates custom fixtures:
  - `api` — an `APIRequestContext` already carrying a bearer token, so API specs skip login.
  - `authedPage` — a browser page already logged in (token seeded into `localStorage`), so UI
    specs start past the login screen.
  - `resetState` — `{ auto: true }` runs before **every** test and reseeds the app, which is
    what makes the suite parallel-safe and order-independent.
- Compare to TestNG `@BeforeMethod` / dependency injection — fixtures are that, but composable
  and lazy (only built when a test asks for them).

## Hour 9 — UI specs and data-driven tests

- Read `tests/ui/login.spec.ts` and `tests/ui/tasks.spec.ts`.
- Note the `for (const title of [...]) { test(... ) }` loop — data-driven tests without a
  separate data provider.
- Assertions are web-first and auto-retrying: `await expect(locator).toBeVisible()`,
  `toHaveText`, `toHaveCount`, `toHaveClass(/done/)`.

## Hour 10 — Config, projects, reporters

- Read `playwright.config.ts`.
- `projects` split the run: an `api` project (no browser) and `chromium`/`firefox`/`webkit`
  projects (browser), each matched by file path.
- `webServer` boots the app before the run and tears it down after — but only when `BASE_URL`
  is unset, so CI/compose can point at an external app instead.
- Reporters: `html` (rich, `npm run report`) + `list` (console). `trace: 'on-first-retry'`
  gives you a full time-travel trace only when something flakes.

## Hour 11 — CI

- Read `.github/workflows/ci.yml`.
- Two jobs: a **smoke** job (API + Chromium) for fast PR feedback, and a **full**
  cross-browser job. Both run `npx playwright install --with-deps` and upload the HTML report
  as an artifact. This is your "quality gate" talking point.
- Push to GitHub and watch the badge in the README go green.

## Hour 12 — Make it yours

- Add one new endpoint to `app/server.js` (e.g. `PATCH /api/tasks/:id/done`) and write both an
  API and a UI test for it. Update `docs/TRACEABILITY.md`. Doing this end-to-end is the single
  best interview-prep exercise — you'll have built a feature's worth of coverage yourself.

---

## Interview soundbites (things to be able to say)

- "I used Playwright with TypeScript, Page Object Model, and custom fixtures for auth reuse and
  per-test state reset, so the suite runs in parallel without flake."
- "Same app tested at two layers — API for speed and contract, UI cross-browser for the real
  user path — gated in GitHub Actions with a fast smoke job and a full regression job."
- "Negative and edge cases (401/404/422) are first-class, mapped back to requirements in a
  traceability matrix."

## Selenium → Playwright quick map

| Selenium / Java idea | Playwright / TS equivalent |
|----------------------|----------------------------|
| `WebDriver`, explicit waits | `Page` + auto-waiting `Locator`s (no explicit waits) |
| Page Object Model | Same — in `pages/` |
| TestNG `@BeforeMethod`, DI | Custom **fixtures** (`base.extend`) |
| RestAssured | `request` / `APIRequestContext` |
| Selenium Grid for parallel/cross-browser | `projects` + `fullyParallel` |
| TestNG data providers | `for (...) { test(...) }` loops |
| Maven Surefire reports | Playwright HTML report + traces |
