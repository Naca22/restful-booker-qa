import { test, expect } from './utils/fixtures';
import { buildBooking } from './utils/data';

/**
 * Booking CRUD lifecycle.
 *
 * These tests are deliberately run in serial order (`test.describe.serial`)
 * because they tell one continuous story: we create a booking, then read it,
 * filter for it, update it, patch it, and finally delete it. Each step depends
 * on the booking id produced by the create step.
 *
 * The alternative, as making every test fully independent, would mean creating
 * and deleting a booking inside every single test. For a CRUD
 * walkthrough, a serial flow is clearer and closer to how a real user
 * journey behaves.
 */
test.describe.serial('Booking lifecycle (create -> read -> update -> delete)', () => {
  // Shared across the serial steps.
  let bookingId: number;
  const booking = buildBooking();

  test('TC04 @positive POST /booking creates a booking and gives back the data', async ({ request }) => {
    const response = await request.post('/booking', { data: booking });

    // NOTE: restful-booker returns 200 here. A strict REST API would return
    // 201 Created for a successful creation; that observation is logged in
    // BUGS.md but is not treated as a hard failure.
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('bookingid');
    expect(typeof body.bookingid).toBe('number');

    // The returned booking should match exactly what we sent.
    expect(body.booking).toEqual(booking);

    // Remember the id for the following steps.
    bookingId = body.bookingid;
  });

  test('TC05 @positive GET /booking/{id} returns the booking we just created', async ({ request }) => {
    const response = await request.get(`/booking/${bookingId}`);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toEqual(booking);
  });

  test('TC06 @positive GET /booking?firstname=&lastname= includes our booking id', async ({ request }) => {
    const response = await request.get('/booking', {
      params: { firstname: booking.firstname, lastname: booking.lastname },
    });

    expect(response.status()).toBe(200);
    const ids = (await response.json()) as Array<{ bookingid: number }>;

    // The filtered list should contain the booking we created above.
    expect(ids.some((entry) => entry.bookingid === bookingId)).toBeTruthy();
  });

  test('TC07 @positive PUT /booking/{id} with auth fully updates the booking', async ({ request, authToken }) => {
    const updated = buildBooking({
      firstname: 'Updated',
      lastname: 'Name',
      totalprice: 999,
      depositpaid: false,
      additionalneeds: 'Late checkout',
    });

    const response = await request.put(`/booking/${bookingId}`, {
      headers: { Cookie: `token=${authToken}` },
      data: updated,
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toEqual(updated);
  });

  test('TC08 @positive PATCH /booking/{id} with auth updates only the given fields', async ({ request, authToken }) => {
    const patch = { firstname: 'Patched', totalprice: 1 };

    const response = await request.patch(`/booking/${bookingId}`, {
      headers: { Cookie: `token=${authToken}` },
      data: patch,
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    // Patched fields changed
    expect(body.firstname).toBe('Patched');
    expect(body.totalprice).toBe(1);
    // A field we did not patch keeps its previous (updated) value.
    expect(body.lastname).toBe('Name');
  });

  test('TC09 @positive DELETE /booking/{id} with auth removes the booking', async ({ request, authToken }) => {
    const deleteResponse = await request.delete(`/booking/${bookingId}`, {
      headers: { Cookie: `token=${authToken}` },
    });

    // NOTE: a successful delete returns 201 Created here. 200/204 would be the more
    // conventional choice here (logged in BUGS.md). Asserted as it is, so the test reflects
    // the real state.
    expect(deleteResponse.status()).toBe(201);

    // Confirm the booking is really gone: should show 404 status code.
    const getResponse = await request.get(`/booking/${bookingId}`);
    expect(getResponse.status()).toBe(404);
  });
});
