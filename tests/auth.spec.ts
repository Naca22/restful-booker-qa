import { test, expect } from '@playwright/test';
import { ADMIN_CREDENTIALS } from './utils/data';

/**
 * Authentication endpoint: POST /auth
 *
 * A valid username/password should return a token that can be used to
 * authorise write operations (PUT/PATCH/DELETE).
 */
test('TC02 @positive POST /auth with valid credentials returns a token', async ({ request }) => {
  const response = await request.post('/auth', { data: ADMIN_CREDENTIALS });

  expect(response.status()).toBe(200);

  const body = await response.json();
  // The token should be present and look like a real token (non-empty string).
  expect(body).toHaveProperty('token');
  expect(typeof body.token).toBe('string');
  expect(body.token.length).toBeGreaterThan(0);
});

/**
 * TC03 — DEFECT DEMONSTRATION (see BUGS.md #1)
 *
 * Sending wrong credentials should be rejected with HTTP 401 Unauthorized.
 * Instead, restful-booker responds 200 OK.
 *
 * We assert the correct, expected behaviour (401).
 */
test('TC03 @negative @defect POST /auth with invalid credentials should return 401', async ({ request }) => {

  const response = await request.post('/auth', {
    data: { username: ADMIN_CREDENTIALS.username, password: 'definitely-wrong' },
  });

  // Correct behaviour: authentication failure is a 401.
  expect(response.status()).toBe(401);
});
