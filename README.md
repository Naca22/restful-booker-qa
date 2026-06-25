# Restful-Booker API Test Suite

Automated API tests for the [restful-booker](https://restful-booker.herokuapp.com/apidoc/index.html) API, built with [Playwright](https://playwright.dev/) and TypeScript.

The suite covers the authentication and booking CRUD endpoints with a mix of positive, negative, security and defect-demonstration tests, and produces an HTML report. A GitHub Actions workflow runs it automatically.

## 1. Setup

**Prerequisites:** [Node.js](https://nodejs.org/) 18 or newer (includes `npm`).

```bash
# 1. Clone the repository
git clone https://github.com/Naca22/restful-booker-qa
cd restful-booker-qa

# 2. Install dependencies
npm install
```

This is an **API-only** suite, so there is no need to download Playwright browsers (`npx playwright install` is not needed).

## 2. Running the suite

```bash
# Run every test
npm test

# Open the HTML report after a run
npm run report

# Run a single file
npx playwright test tests/auth.spec.ts

# Run by tag (e.g. only the defect demonstrations)
npx playwright test --grep "@defect"
```

By default, the tests run against `https://restful-booker.herokuapp.com`.

## 3. Test strategy

### What this suite covers

The goal is broad, meaningful coverage of the documentation, rather than testing
every variation. The chosen scenarios span several dimensions:

| **Smoke / health** | `GET /ping` confirms the system is up before anything else runs.
| **Authentication** | The token mechanism gates every write operation, so it has to work.
| **Happy-path CRUD** | Create, Read, Update (PUT), partial update (PATCH) and Delete are the core of the API.
| **Send-and-retrieve consistency** | We assert that what we send is exactly what we get back, on create, read and update.
| **Negative input** | Requesting a non-existent booking and sending irregular payloads.
| **Security / authorisation** | A protected write is rejected when no token is supplied.
| **Defects** | Two tests result with bugs (see `BUGS.md`).

The CRUD tests run as a single serial flow (create → read → filter → update → patch → delete) because they describe one continuous user journey and each step needs the booking id from the previous one. Independent checks (404s, auth-less requests) live in their own files and run in parallel.

### What was deliberately left out, and why

- **Exhaustive field-level validation** (every field with every bad type). The Bug #2 has shown the validation gap, which is a good demonstration in case when there is a limited number of test cases to perform.
- **Performance / load testing.** This is a free, shared Heroku instance; load testing it would be meaningless. Functional correctness is the focus.
- **Exhaustive date-format and currency-format testing.** Good to test at some level, but lower value than getting solid coverage of the core CRUD testing first.

### A note on the shared test instance

restful-booker is a public, shared instance that resets.
The tests are written to be self-contained: each run creates its own booking and
deletes it, and reads are scoped to ids the test itself created, so a reset (or
another user's data) between runs does not break them. The only data assumption
is that booking id `1` exists for the auth-less `PUT` security check (TC11),
which is safe since TC11 never actually modifies it (the request is rejected first).

## 4. Test cases

| ID | Type | Endpoint | What it verifies |

| TC01 | positive | `GET /ping` | API is up; returns the documented `201`. |
| TC02 | positive | `POST /auth` | Valid credentials return a non-empty token. |
| TC03 | negative / defect | `POST /auth` | Invalid credentials should return `401` (currently `200` — Bug #1). |
| TC04 | positive | `POST /booking` | A booking is created and the response matches the sent data. |
| TC05 | positive | `GET /booking/{id}` | The created booking can be fetched and matches. |
| TC06 | positive | `GET /booking?firstname=&lastname=` | Name filter returns the created booking's id. |
| TC07 | positive | `PUT /booking/{id}` | With a token, a full update replaces all fields. |
| TC08 | positive | `PATCH /booking/{id}` | With a token, a partial update changes only the given fields. |
| TC09 | positive | `DELETE /booking/{id}` | With a token, the booking is deleted and a follow-up `GET` returns `404`. |
| TC10 | negative | `GET /booking/{id}` | A non-existent id returns `404`. |
| TC11 | negative / security | `PUT /booking/{id}` | A write with no token is rejected with `403`. |
| TC12 | negative / defect | `POST /booking` | Missing required fields should return `400` (currently `500` — Bug #2). |

The two `@defect` tests assert the expected behaviour.

## 5. Why Playwright?

Playwright was chosen as the test runner and HTTP client for this task.

**Why it fits this system:**

- **Suitable for API testing.** Playwright's built-in `request` fixture is a full
  HTTP client (`get`/`post`/`put`/`patch`/`delete`, headers, query params, JSON
  bodies). For a pure-API system like restful-booker, no browser is ever
  launched, so the suite is fast and lightweight.
- **Fixtures = clean auth handling.** The `authToken` fixture (`tests/utils/fixtures.ts`)
  lets any test that needs authorisation just declare it; the token is fetched
  automatically. This keeps the write tests readable.
- **CI-friendly.** Built-in retries and trace-on-retry handle potential flakiness of a
  free Heroku instance.

**Tools considered and rejected:**

- **Pytest** — common in API-testing, but rejected mainly because I'm more familiar and experienced with Playwright, so I wanted to be more efficient with the task.
- **Postman** — Better for manual exploration than as automated testing suite. Harder to review and refactor (especially in Git) than Playwright.
- **Cypress** — Its design centre is browser/UI testing

## 6. Bonus

- **HTML report:** generated automatically into `playwright-report/` on every
  run; open it with `npm run report`.
- **CI:** `.github/workflows/playwright.yml` runs the full suite on every push
  and pull request, and uploads the HTML report as a build artifact.

## 7. Project structure

```
restful-booker-qa/
├── tests/
│   ├── utils/
│   │   ├── data.ts          # Credentials + booking payload factory
│   │   └── fixtures.ts      # authToken fixture (dependency injection)
│   ├── health.spec.ts       # TC01
│   ├── auth.spec.ts         # TC02, TC03
│   ├── booking-crud.spec.ts # TC04–TC09 (serial lifecycle)
│   └── booking-negative.spec.ts # TC10–TC12
├── .github/workflows/playwright.yml  # CI
├── playwright.config.ts
├── package.json
├── tsconfig.json
├── BUGS.md                  # Defect reports
└── README.md
```
