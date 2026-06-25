/**
 * Centralised test data.
 *
 * Keeping payloads and credentials in one place means a change to the API
 * contract only has to be updated once, not in every spec file.
 */

// Admin credentials are published in the restful-booker docs for testing.
export const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'password123',
};

export interface BookingDates {
  checkin: string;
  checkout: string;
}

export interface Booking {
  firstname: string;
  lastname: string;
  totalprice: number;
  depositpaid: boolean;
  bookingdates: BookingDates;
  additionalneeds?: string;
}

/**
 * Returns a valid booking payload. Accepts overrides so a test can change
 * just the one field it cares about while keeping the rest valid.
 *
 * A factory (rather than a shared constant) avoids tests accidentally
 * mutating the same object and interfering with each other.
 */
export function buildBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    firstname: 'Natalija',
    lastname: 'Popovic',
    totalprice: 150,
    depositpaid: true,
    bookingdates: {
      checkin: '2026-07-01',
      checkout: '2026-07-10',
    },
    additionalneeds: 'Breakfast',
    ...overrides,
  };
}
