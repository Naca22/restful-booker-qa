import { defineConfig } from '@playwright/test';

/**
 * Playwright configuration for the restful-booker API test suite.
 *
 * This is an API-only suite, so we do not launch any browsers. All requests
 * go through Playwright's built-in `request` fixture, which is a lightweight
 * HTTP client with the same assertion ergonomics as the rest of Playwright.
 */
export default defineConfig({
  testDir: './tests',

  // Fail the CI build if someone accidentally commits a `test.only`.
  forbidOnly: !!process.env.CI,

  // restful-booker is a shared public instance that can be flaky / slow
  // (Heroku cold starts). One retry locally, two on CI smooths over noise
  // without hiding real, repeatable failures.
  retries: process.env.CI ? 2 : 1,

  // Run tests in parallel for speed. CRUD lifecycle steps that depend on each
  // other are kept inside a single serial describe block (see booking-crud.spec.ts).
  fullyParallel: true,

  // Built-in HTML report — opens automatically on failure when run locally.
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],

  use: {
    // Base URL so every test can use relative paths like '/booking'.
    baseURL: process.env.BASE_URL ?? 'https://restful-booker.herokuapp.com',

    // Default headers applied to every request unless overridden per-call.
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },

    // Capture full request/response traces on the first retry for debugging.
    trace: 'on-first-retry',
  },

  // A generous timeout because Heroku free-tier dynos can be slow to wake up.
  timeout: 30_000,
  expect: { timeout: 10_000 },
});
