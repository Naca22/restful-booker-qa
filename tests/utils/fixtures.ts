import { test as base, expect, type APIRequestContext } from '@playwright/test';
import { ADMIN_CREDENTIALS } from './data';

/**
 * Requests a fresh auth token from POST /auth.
 *
 * PUT, PATCH and DELETE on a booking all require authorisation. The docs
 * allow either Basic Auth or a cookie containing the token; this suite uses
 * the cookie approach (`Cookie: token=...`).
 */
export async function getAuthToken(request: APIRequestContext): Promise<string> {
  const response = await request.post('/auth', { data: ADMIN_CREDENTIALS });
  expect(response.ok(), 'auth request should succeed').toBeTruthy();
  const body = await response.json();
  expect(body.token, 'auth response should contain a token').toBeTruthy();
  return body.token as string;
}

/**
 * Extends the base Playwright `test` with an `authToken` fixture.
 *
 * Any test that writes `async ({ request, authToken }) => ...` automatically
 * gets a valid token without having to authenticate by hand. This is
 * dependency injection: the test declares what it needs, the fixture provides it.
 */
export const test = base.extend<{ authToken: string }>({
  authToken: async ({ request }, use) => {
    const token = await getAuthToken(request);
    await use(token);
  },
});

export { expect };
