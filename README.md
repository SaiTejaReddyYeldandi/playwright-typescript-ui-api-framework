# Playwright + TypeScript: UI & API Test Framework

A test-automation framework that exercises the **same application two ways** — through its
**REST API** and through its **browser UI** (Page Object Model, cross-browser) — and runs
the lot in CI against a self-contained Dockerised Node app.

It is built the way I tested production systems for 32 months: requirement → test case →
automated check → CI gate, with negative and edge cases treated as first-class.

[![tests](https://github.com/SaiTejaReddyYeldandi/playwright-typescript-ui-api-framework/actions/workflows/ci.yml/badge.svg)](https://github.com/SaiTejaReddyYeldandi/playwright-typescript-ui-api-framework/actions/workflows/ci.yml)

---

## What it demonstrates

- **Playwright + TypeScript** end-to-end and API testing.
- **Page Object Model** — selectors and actions live in `pages/`, never in the specs.
- **Custom fixtures** (`fixtures/test-fixtures.ts`) — a pre-authenticated API context, a
  pre-logged-in browser page, and an autouse per-test state reset so every test is
  independent and parallel-safe.
- **Cross-browser** UI runs across Chromium, Firefox and WebKit.
- **API testing** with Playwright's `APIRequestContext` — status codes, JSON bodies,
  full CRUD lifecycle, auth, and negative cases (401 / 404 / 422).
- **Data-driven** tests (one spec, many inputs).
- **CI quality gate** in GitHub Actions: a fast API+Chromium smoke job on every push/PR,
  plus a full cross-browser regression job. HTML reports uploaded as artifacts.
- **Dockerised app under test** + `docker-compose` to run the whole thing in containers.
- **Traceability** matrix mapping every requirement to its test (`docs/TRACEABILITY.md`).

## Test coverage

| Layer | Spec | Tests | What it checks |
|-------|------|-------|----------------|
| API   | `tests/api/auth.api.spec.ts`  | 3  | login success, 401 on bad credentials, 401 on missing token |
| API   | `tests/api/tasks.api.spec.ts` | 5  | list, full create→read→update→delete lifecycle, 422 validation, 404s |
| UI    | `tests/ui/login.spec.ts`      | 3  | valid login, invalid-login error, logout |
| UI    | `tests/ui/tasks.spec.ts`      | 8  | seed list, add, empty-title validation, complete, delete, 3 data-driven adds |

**19 checks per browser.** API: 8. UI: 11 × {Chromium, Firefox, WebKit}.

## Project layout

```
.
├── app/                     # demo app under test (Express + static UI, Dockerised)
│   ├── server.js            #   auth + task CRUD REST API
│   └── public/index.html    #   minimal UI with stable data-testid hooks
├── pages/                   # Page Object Model
│   ├── LoginPage.ts
│   └── TasksPage.ts
├── fixtures/
│   └── test-fixtures.ts     # authed API context, pre-logged-in page, state reset
├── utils/
│   └── testData.ts          # users + unique-data helpers
├── tests/
│   ├── api/                 # API specs (no browser needed)
│   └── ui/                  # UI specs (cross-browser)
├── docs/TRACEABILITY.md     # requirement → test mapping
├── playwright.config.ts     # projects, reporters, webServer, env-driven baseURL
├── docker-compose.yml       # app + tests in containers
└── .github/workflows/ci.yml # smoke + full cross-browser jobs
```

## Running it

Prerequisites: Node 20+.

```bash
# 1. install framework + app dependencies
npm install
npm install --prefix app

# 2. install browser binaries (one-off)
npx playwright install

# 3. run everything (Playwright starts the app automatically)
npm test

# useful subsets
npm run test:api          # API only, no browser
npm run test:chromium     # UI on Chromium only
npm run report            # open the HTML report
npm run typecheck         # tsc --noEmit
```

### In Docker

```bash
docker compose up --build --abort-on-container-exit
```

## How the app behaves (the contract under test)

| Method & path        | Auth | Behaviour |
|----------------------|------|-----------|
| `POST /api/login`    | no   | 200 + token for valid creds, else 401 |
| `GET /api/tasks`     | yes  | 200 list, 401 without token |
| `GET /api/tasks/:id` | yes  | 200 task, 404 if missing |
| `POST /api/tasks`    | yes  | 201 created, 422 if title missing |
| `PUT /api/tasks/:id` | yes  | 200 updated, 404 if missing |
| `DELETE /api/tasks/:id` | yes | 204, 404 if missing |
| `POST /api/reset`    | no   | restores seed data (test helper) |

## Design notes

- **`data-testid` selectors.** The UI exposes test hooks so tests don't depend on copy or
  layout. Page objects use `getByTestId` / `getByRole` for resilience.
- **Independent tests.** The `resetState` autouse fixture reseeds the app before each test,
  so the suite is order-free and safe to run in parallel.
- **Auth done once, reused.** Fixtures log in via the API and seed the token, so UI specs
  start already authenticated instead of re-driving the login form every time.
- **Env-driven base URL.** `BASE_URL` lets CI/compose target an external app; unset, the
  config boots the app itself.
