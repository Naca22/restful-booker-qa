import { test, expect } from '@playwright/test';

/**
 * Health check
 *
 * GET /ping is the simple signal that the API is alive. We run it
 * first as a smoke test: if this fails, every other test is going to fail too.
 *
 * NOTE: restful-booker deliberately returns 201 Created here, not 200 OK.
 * Because it is the documented, intended behaviour we assert 201 (a passing test), and we record the design
 * observation in BUGS.md.
 */
test('TC01 @positive GET /ping returns 201 and confirms the API is up', async ({ request }) => {
  const response = await request.get('/ping');
  expect(response.status()).toBe(201);
});
