# Playwright + TypeScript — UI & API Test Framework

[![tests](https://github.com/SaiTejaReddyYeldandi/playwright-typescript-ui-api-framework/actions/workflows/ci.yml/badge.svg)](https://github.com/SaiTejaReddyYeldandi/playwright-typescript-ui-api-framework/actions/workflows/ci.yml)

A production-grade test automation framework that tests the **same application at two layers** — REST API and browser UI — runs cross-browser, and is gated in GitHub Actions CI. Built with Playwright, TypeScript, Page Object Model, custom fixtures, and Docker.

> **For the reader:** This README is written to serve three audiences at once — a recruiter or test manager evaluating the framework, the author returning after months away, and any AI assistant (Claude, ChatGPT) that needs to understand the full project without reading source code.

---

## Table of Contents

1. [What This Project Demonstrates](#1-what-this-project-demonstrates)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [The Application Under Test](#4-the-application-under-test)
5. [Test Coverage](#5-test-coverage)
6. [Traceability Matrix](#6-traceability-matrix)
7. [How to Run Locally](#7-how-to-run-locally)
8. [How to Run in Docker](#8-how-to-run-in-docker)
9. [CI/CD Pipeline](#9-cicd-pipeline)
10. [Framework Design Decisions](#10-framework-design-decisions)
11. [Key Concepts Explained](#11-key-concepts-explained)
12. [Interview Notes — Talking Points](#12-interview-notes--talking-points)
13. [Selenium → Playwright Quick Map](#13-selenium--playwright-quick-map)
14. [Real Bug Fixed in This Project](#14-real-bug-fixed-in-this-project)

---

## 1. What This Project Demonstrates

| Skill | Where to see it |
|---|---|
| Playwright + TypeScript end-to-end testing | `tests/ui/` |
| REST API testing (status codes, JSON, CRUD, auth) | `tests/api/` |
| Page Object Model (POM) | `pages/LoginPage.ts`, `pages/TasksPage.ts` |
| Custom fixtures (auth reuse, state reset, DI) | `fixtures/test-fixtures.ts` |
| Cross-browser testing — Chromium, Firefox, WebKit | `playwright.config.ts` → `projects` |
| Data-driven tests | `tests/ui/tasks.spec.ts` (for loop) |
| Negative and edge cases (401, 404, 422) | `tests/api/tasks.api.spec.ts` |
| CI quality gate — smoke + full regression | `.github/workflows/ci.yml` |
| Docker-containerised app + test runner | `docker-compose.yml`, `app/Dockerfile` |
| Requirement traceability | `docs/TRACEABILITY.md` |
| Environment-driven config | `playwright.config.ts` → `BASE_URL` |

---

## 2. Tech Stack

| Tool | Version | Role |
|---|---|---|
| [Playwright](https://playwright.dev) | 1.56 | Test runner, browser automation, API client |
| TypeScript | 5.6 | Type-safe test code |
| Node.js | 20 | Runtime |
| Express | — | The demo app under test |
| Docker + Docker Compose | — | Containerised app + CI-identical local runs |
| GitHub Actions | — | CI/CD pipeline |

---

## 3. Project Structure

```
playwright-typescript-ui-api-framework/
│
├── app/                          # The application under test (NOT the portfolio piece)
│   ├── server.js                 #   Express REST API — auth + task CRUD
│   ├── public/index.html         #   Single-page UI with data-testid hooks on every element
│   ├── package.json              #   App dependencies (express only)
│   └── Dockerfile                #   Containerises the app for Docker runs
│
├── pages/                        # Page Object Model layer
│   ├── LoginPage.ts              #   Locators + actions for the login screen
│   └── TasksPage.ts              #   Locators + actions for the task board
│
├── fixtures/
│   └── test-fixtures.ts          # Custom fixtures: authed API, authed page, state reset
│
├── utils/
│   └── testData.ts               # Test users, unique title generator
│
├── tests/
│   ├── api/
│   │   ├── auth.api.spec.ts      # API: login success, 401 bad creds, 401 no token
│   │   └── tasks.api.spec.ts     # API: list, CRUD lifecycle, 422 validation, 404s
│   └── ui/
│       ├── login.spec.ts         # UI: valid login, invalid login, logout
│       └── tasks.spec.ts         # UI: seed list, add, validate, toggle, delete, data-driven
│
├── docs/
│   └── TRACEABILITY.md           # Requirement → test mapping (11 requirements)
│
├── playwright.config.ts          # Projects, reporters, webServer, env config
├── docker-compose.yml            # Runs app + tests together in containers
├── .github/workflows/ci.yml      # Smoke job + full cross-browser job
├── package.json                  # npm scripts
└── tsconfig.json                 # TypeScript config
```

---

## 4. The Application Under Test

A deliberately small **TaskBoard** app built with Express + vanilla JavaScript. It gives the framework a real UI and a real REST API to drive, with the exact behaviours QA cares about: authentication, validation errors, CRUD state changes, and proper HTTP status codes.

**Credentials:** `demo` / `Password123`

### REST API Contract

| Method + Path | Auth required | Success | Error |
|---|---|---|---|
| `POST /api/login` | No | `200` + JWT-style token | `401` bad credentials |
| `GET /api/tasks` | Yes | `200` task array | `401` missing/bad token |
| `GET /api/tasks/:id` | Yes | `200` single task | `404` not found |
| `POST /api/tasks` | Yes | `201` created task | `422` missing title |
| `PUT /api/tasks/:id` | Yes | `200` updated task | `404` not found |
| `DELETE /api/tasks/:id` | Yes | `204` no content | `404` not found |
| `POST /api/reset` | No | `200` reseeds test data | — |

**Seed data (restored before every test):**
- Task 1: "Write test plan" — done ✓
- Task 2: "Automate login flow" — not done

---

## 5. Test Coverage

| Layer | Spec file | Count | What is tested |
|---|---|---|---|
| API | `auth.api.spec.ts` | 3 | Valid login → token, bad creds → 401, no token → 401 |
| API | `tasks.api.spec.ts` | 5 | GET list, full create→read→update→delete lifecycle, empty title → 422, GET 404, DELETE 404 |
| UI | `login.spec.ts` | 3 | Valid login lands on task board, invalid login shows error message, logout returns to login |
| UI | `tasks.spec.ts` | 8 | Seed tasks visible, add task, empty-title validation, toggle complete, delete, + 3 data-driven adds |

**Total: 19 test cases.**
- API layer: 8 tests (no browser, fast)
- UI layer: 11 tests × 3 browsers = 33 browser executions per full run

---

## 6. Traceability Matrix

Maps requirements to automated checks — the same discipline used with Jira + Xray/Zephyr.

| ID | Requirement | Covered by | Layer |
|---|---|---|---|
| R-01 | Valid credentials sign the user in | `auth.api` valid login · `ui/login` valid login | API + UI |
| R-02 | Invalid credentials are rejected with an error | `auth.api` bad creds → 401 · `ui/login` error shown | API + UI |
| R-03 | Protected endpoints require a bearer token | `auth.api` no-token → 401 | API |
| R-04 | Signed-in user sees their task list | `tasks.api` list · `ui/tasks` seed list | API + UI |
| R-05 | User can create a new task | `tasks.api` create · `ui/tasks` add + data-driven | API + UI |
| R-06 | Empty task titles are rejected | `tasks.api` 422 · `ui/tasks` validation error | API + UI |
| R-07 | User can mark a task complete | `tasks.api` update (done: true) · `ui/tasks` toggle | API + UI |
| R-08 | User can delete a task | `tasks.api` delete · `ui/tasks` delete | API + UI |
| R-09 | Reading a missing task returns 404 | `tasks.api` GET missing → 404 | API |
| R-10 | Deleting a missing task returns 404 | `tasks.api` DELETE missing → 404 | API |
| R-11 | User can sign out | `ui/login` logout → login screen | UI |

**11 requirements. Every one has at least one automated check. 8 are covered at both API and UI layers.**

---

## 7. How to Run Locally

### Prerequisites
- Node.js 20+
- (Windows only) Add a Windows Defender exclusion before installing browsers — see below

### Windows Defender — One-Time Fix
Windows Defender deletes Playwright browser `.exe` files on download. Add this folder as an exclusion first:

```
Windows Security → Virus & threat protection → Manage settings
→ Exclusions → Add an exclusion → Folder
→ Paste: %LOCALAPPDATA%\ms-playwright
```

### Setup (one-time)

```bash
npm ci                            # install framework dependencies
npm ci --prefix app               # install app dependencies
npx playwright install chromium   # install Chromium browser (fastest)
```

### Run Tests

```bash
npm test                  # full suite — Playwright auto-starts the app server

npm run test:api          # API tests only (no browser, fastest)
npm run test:ui           # UI tests only (Chromium + Firefox + WebKit)
npm run test:chromium     # UI on Chromium only

npm run report            # open the last HTML report in browser
npm run typecheck         # TypeScript type check (no test run)
```

### How the app server works locally
`playwright.config.ts` has a `webServer` block. When `BASE_URL` is not set in your environment, Playwright **automatically starts** `node app/server.js` on port 3000 before the tests and kills it after. You do not need to start the app manually.

---

## 8. How to Run in Docker

Mirrors CI exactly. No browser installation, no Defender issues.

```bash
docker compose up --build --abort-on-container-exit
```

This starts the app in one container and runs the full test suite in another. The app container is healthy-checked before tests begin.

---

## 9. CI/CD Pipeline

File: `.github/workflows/ci.yml`

Two jobs run on every push and pull request to `main`:

### Job 1 — Smoke (fast feedback, ~2 min)
- Runs: API tests + Chromium UI only (`--project=api --project=chromium`)
- Purpose: Catch regressions fast on every push/PR
- Browser install: Chromium only (`npx playwright install --with-deps chromium`)

### Job 2 — Full cross-browser (complete confidence, ~5 min)
- Runs: All 4 projects — api, chromium, firefox, webkit (`npx playwright test`)
- Purpose: Full regression + cross-browser confidence
- Browser install: All browsers (`npx playwright install --with-deps`)

Both jobs:
- Use `ubuntu-latest` runner (Linux, no Defender)
- Run `npm ci` + `npm ci --prefix app`
- Let `playwright.config.ts` auto-start the app via `webServer`
- Upload the Playwright HTML report as a downloadable artifact (7-day / 14-day retention)

The green badge at the top of this README comes from this workflow.

---

## 10. Framework Design Decisions

### Why `data-testid` attributes?
Every interactive element in the HTML has a `data-testid` (e.g., `data-testid="login-btn"`). Page objects use `page.getByTestId(...)` to find them. This makes selectors **immune to visual redesigns** — if the button text changes from "Log in" to "Sign in", the test still passes.

### Why Page Object Model?
Selectors and actions live in `pages/LoginPage.ts` and `pages/TasksPage.ts`, never inside specs. If the UI changes, you fix one file, not twenty specs. Each page class exposes **named methods** (`login()`, `addTask()`, `deleteTask()`) so specs read like plain English.

### Why custom fixtures instead of `beforeEach`?
Three problems with `beforeEach`:
1. It runs for every test even when not needed
2. It can't easily share state (e.g., a logged-in token) with the test
3. It creates setup/teardown coupling

Custom fixtures (`fixtures/test-fixtures.ts`) solve all three:
- **`api`** — an `APIRequestContext` pre-loaded with a valid bearer token. API specs skip login entirely.
- **`authedPage`** — a browser page with the token already in `localStorage`. UI specs start past the login screen.
- **`resetState`** — `{ auto: true }` runs before every single test automatically, calling `POST /api/reset` to restore seed data. This makes the suite **parallel-safe and order-independent**.

### Why test at both API and UI layers?
- **API tests** are fast (no browser), give precise contract validation (exact status codes, exact JSON), and run in seconds.
- **UI tests** prove the real user journey works across all three browser engines.
- Testing the same requirement at both layers catches two different classes of bug: broken backend logic (API) and broken frontend wiring (UI).

### Why env-driven `BASE_URL`?
`playwright.config.ts` reads `process.env.BASE_URL`. When it is set, the config skips the `webServer` block and points tests at an external app (used by Docker compose and allows pointing at staging/QA environments). When unset (local dev), Playwright starts the app itself.

---

## 11. Key Concepts Explained

### Playwright Locators and auto-waiting
Unlike Selenium, Playwright locators **do not execute immediately**. They are lazy references. When you call `await expect(locator).toBeVisible()`, Playwright polls the DOM until the condition is true or the timeout (30s) expires. There are **no explicit waits, no `Thread.sleep`, no `WebDriverWait`** needed.

```typescript
// Bad (Selenium habit) — don't do this:
await page.waitForTimeout(2000);
await page.click('#btn');

// Good (Playwright way):
await page.getByTestId('login-btn').click();  // waits for it to be clickable automatically
```

### Projects in `playwright.config.ts`
A "project" is a named configuration slice. This project has 4:
```typescript
{ name: 'api',      testMatch: /tests\/api\// }                          // no browser
{ name: 'chromium', testMatch: /tests\/ui\//, use: devices['Desktop Chrome'] }
{ name: 'firefox',  testMatch: /tests\/ui\//, use: devices['Desktop Firefox'] }
{ name: 'webkit',   testMatch: /tests\/ui\//, use: devices['Desktop Safari'] }
```
Run a specific project: `npx playwright test --project=chromium`

### `fullyParallel: true`
Tests within a spec file run in parallel (not just file-by-file). This is safe because `resetState` autouse fixture reseeds the app before each individual test.

### Traces, screenshots, videos
```typescript
trace: 'on-first-retry'       // full timeline trace only when a test retries (flake debugging)
screenshot: 'only-on-failure' // screenshot saved when a test fails
video: 'retain-on-failure'    // video saved when a test fails
```
To view a trace: `npx playwright show-trace trace.zip`

---

## 12. Interview Notes — Talking Points

### The one-sentence answer to "Tell me about this framework"
> "A Playwright + TypeScript framework that tests the same application at two layers — REST API for fast contract validation and browser UI cross-browser using Page Object Model — with custom fixtures for auth reuse and per-test state reset, gated in GitHub Actions with a smoke job and a full regression job."

### Common interview questions and answers

**Q: Why Playwright over Selenium?**
> Playwright bundles its own browsers so there's no driver/browser version mismatch. Auto-waiting locators eliminate explicit waits. First-class API testing, tracing, and TypeScript support are built in. Cross-browser including WebKit (Safari engine) from one framework.

**Q: What is a fixture and why use it?**
> A fixture is a reusable piece of test setup/teardown that Playwright injects into a test via its function signature. I used three: `api` (pre-authenticated API context), `authedPage` (pre-logged-in browser page), and `resetState` (auto-runs before every test to reseed the app). Fixtures are composable, lazy, and type-safe — better than `beforeEach` for shared state.

**Q: How do you make tests independent when running in parallel?**
> The `resetState` fixture is marked `{ auto: true }`, so it runs before every test without being requested. It calls `POST /api/reset` which restores the in-memory database to its seed state. Every test therefore starts from a known baseline, regardless of what other tests ran before or alongside it.

**Q: How do you handle authentication in tests?**
> I don't drive the login form for every test. The `api` fixture calls `POST /api/login` once via HTTP and stores the token. The `authedPage` fixture does the same and seeds the token directly into `localStorage`, then reloads the page so the app enters its authenticated state immediately. This is faster and more reliable than re-testing the login form repeatedly.

**Q: What is the Page Object Model?**
> POM separates "where things are" (locators, in page classes) from "what to test" (assertions, in specs). If a selector changes, I fix one file. If a flow changes, I update one method. Specs become readable English: `await loginPage.login(user, pass)` instead of `await page.fill('#username', user)`.

**Q: What is a traceability matrix?**
> A table mapping each business requirement to the test cases that cover it. It answers "if requirement R-05 breaks, which tests will catch it?" and proves to stakeholders that no requirement is untested. I keep it in `docs/TRACEABILITY.md` as version-controlled markdown alongside the tests.

**Q: What does your CI pipeline look like?**
> Two GitHub Actions jobs on every push/PR. The smoke job runs API + Chromium in ~2 minutes — fast enough to block a merge within a few minutes. The full job runs all three browser engines for complete cross-browser confidence. Both upload HTML reports as downloadable artifacts. The README badge is live from these jobs.

**Q: What is `data-testid` and why does it matter?**
> It's a custom HTML attribute added to every interactive element (`data-testid="login-btn"`). Tests select elements by this attribute, not by CSS class, XPath, or button text. It survives styling changes and copy changes. It's the habit to lobby for in any real project — QA and dev agree upfront on stable test hooks.

### Numbers to remember
- **19 test cases** total
- **8 API tests** (no browser)
- **11 UI tests** × **3 browsers** = **33 browser test executions** per full run
- **11 requirements** in the traceability matrix, all covered
- **2 CI jobs**: smoke (~2 min) and full cross-browser (~5 min)
- **4 Playwright projects**: api, chromium, firefox, webkit

---

## 13. Selenium → Playwright Quick Map

If you know Selenium/Java, this is how the concepts translate:

| Selenium / Java / TestNG | Playwright / TypeScript equivalent |
|---|---|
| `WebDriver`, `ChromeDriver` | `Page` — browser driver + page in one, no separate driver needed |
| `driver.findElement(By.id(...))` | `page.getByTestId(...)`, `page.getByRole(...)`, `page.locator(...)` |
| `WebDriverWait` / `ExpectedConditions` | Built into every `expect()` — no explicit wait needed |
| `Thread.sleep(2000)` | Never needed — Playwright auto-waits |
| Page Object Model | Same concept — in `pages/` folder |
| TestNG `@BeforeMethod` | Autouse fixture (`{ auto: true }`) |
| TestNG `@BeforeSuite` / DI | Custom fixtures via `base.extend<Fixtures>({...})` |
| TestNG `@DataProvider` | `for (const item of [...]) { test(...) }` loop |
| RestAssured for API testing | `request.newContext()` + `APIRequestContext` (built into Playwright) |
| Selenium Grid / parallel browsers | `projects` + `fullyParallel: true` in `playwright.config.ts` |
| Maven Surefire / Allure | Playwright HTML reporter + traces + `npm run report` |
| Jenkins / TeamCity pipeline | GitHub Actions workflow |

---

## 14. Real Bug Fixed in This Project

### The Problem
After the initial push to GitHub, the **Smoke CI job passed** (API + Chromium) but the **Full cross-browser job failed** at the "Run full suite" step. The error was caused by a single line in `playwright.config.ts`:

```typescript
// WRONG — was in the global `use` block
use: {
  channel: 'chromium',   // ← this killed Firefox and WebKit
}
```

### Why It Failed
`channel` is a Playwright option for selecting a specific Chromium distribution (like Chrome Stable or Chrome Beta). It is **only valid for Chromium**. Firefox and WebKit do not support the `channel` option and throw a hard error:

```
Error: Firefox does not support "channel" option.
Error: WebKit does not support "channel" option.
```

Because the setting was in the **global** `use` block, all projects inherited it — including Firefox and WebKit. Chromium handled it fine (hence Smoke passed), but Firefox and WebKit crashed before a single test ran.

### The Fix
Removed `channel: 'chromium'` from the global `use` block. Playwright uses the bundled Chromium by default anyway — the setting was unnecessary for Chromium and fatal for the others.

### The Lesson
Always scope Chromium-specific options (like `channel`) inside the Chromium project's `use` block, not the global one. Global `use` settings are inherited by **every** project including Firefox and WebKit.

```typescript
// RIGHT — scoped inside the chromium project if ever needed
projects: [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'], channel: 'chrome' },  // scoped here only
  },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit',  use: { ...devices['Desktop Safari'] } },
]
```

This is the kind of real debugging that happens in every project — CI passes on one browser, fails on another, and the root cause is a config option that one engine supports and others don't.

---

## Quick Command Reference

```bash
# Setup
npm ci && npm ci --prefix app
npx playwright install chromium

# Run
npm test                   # everything
npm run test:api           # API only
npm run test:ui            # UI only (all browsers)
npm run test:chromium      # UI Chromium only

# After a run
npm run report             # open HTML report

# Docker (mirrors CI, no browser install needed)
docker compose up --build --abort-on-container-exit

# Type check
npm run typecheck
```

---

*Framework by Sai Teja Reddy Yeldandi — built to demonstrate production QA automation practices with Playwright, TypeScript, and GitHub Actions CI.*
