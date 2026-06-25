import { test, expect } from './utils/fixtures';
import { buildBooking } from './utils/data';

/**
 * Negative and security-focused tests.
 *
 * These check that the API behaves sensibly when it is given bad input or
 * unauthorised requests.
 */

test('TC10 @negative GET /booking/{id} for a non-existent booking returns 404', async ({ request }) => {
  // An id we are confident does not exist.
  const response = await request.get('/booking/99999999');
  expect(response.status()).toBe(404);
});

/**
 * TC11 — Security check.
 *
 * Updating a booking is a protected operation. Without a valid auth token the
 * API must refuse the request. restful-booker correctly returns 403 Forbidden,
 * so this is a passing test that guards against a serious regression (the kind
 * where someone accidentally removes an auth check).
 */
test('TC11 @negative @security PUT /booking/{id} without a token is rejected with 403', async ({ request }) => {
  const response = await request.put('/booking/1', {
    data: buildBooking({ firstname: 'ShouldNotWork' }),
    // Intentionally NO Cookie / Authorization header.
  });

  expect(response.status()).toBe(403);
});

/**
 * TC12 — DEFECT DEMONSTRATION (see BUGS.md #2)
 *
 * Creating a booking with required fields missing is invalid input.
 * API should reject it with 400 Bad Request and a helpful message. Instead,
 * restful-booker returns 500 Internal Server Error, it crashes trying to read
 * fields that are not there, leaking a server-side failure to the client.
 */
test('TC12 @negative @defect POST /booking with missing required fields should return 400', async ({ request }) => {

  const response = await request.post('/booking', {
    data: { firstname: 'OnlyAFirstName' }, // everything else omitted
  });

  // Correct behaviour: reject bad input with a client-error status.
  expect(response.status()).toBe(400);
  
});
