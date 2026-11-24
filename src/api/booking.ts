export type Booking = {
  firstname: string;
  lastname: string;
  totalprice: number;
  depositpaid: boolean;
  bookingdates: {
    checkin: string;
    checkout: string;
  };
  additionalneeds?: string;
};

export type CreatedBooking = {
  bookingid: number;
  booking: Booking;
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isCreatedBooking(value: unknown): value is CreatedBooking {
  return isRecord(value) && typeof value.bookingid === 'number' && isRecord(value.booking);
}

export function buildBooking(overrides: Partial<Booking> = {}): Booking {
  const nonce = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return {
    firstname: `Qa${nonce}`,
    lastname: 'Booker',
    totalprice: 150,
    depositpaid: true,
    additionalneeds: 'Breakfast',
    ...overrides,
    bookingdates: {
      checkin: '2026-06-01',
      checkout: '2026-06-05',
      ...overrides.bookingdates,
    },
  };
}
