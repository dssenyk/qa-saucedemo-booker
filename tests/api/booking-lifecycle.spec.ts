import { expect, test } from '@playwright/test';
import type { Booking } from '../../src/api/booking';
import { buildBooking, isCreatedBooking } from '../../src/api/booking';
import { BookerClient } from '../../src/api/booker-client';

test('authorizes, creates, updates, deletes, and no longer finds the booking', async ({ request }) => {
  const client = new BookerClient(request);
  const booking = buildBooking();
  let token = '';
  let bookingId: number | undefined;

  try {
    await test.step('authorize', async () => {
      const auth = await client.authenticate();
      expect(auth.status).toBe(200);
      expect(auth.token).toEqual(expect.any(String));
      expect(auth.token!.length).toBeGreaterThan(0);
      token = auth.token!;
    });

    await test.step('create a booking', async () => {
      const created = await client.createBooking(booking);
      expect(created.status).toBe(200);
      expect(isCreatedBooking(created.body)).toBe(true);
      if (!isCreatedBooking(created.body)) {
        return;
      }
      bookingId = created.body.bookingid;
      expect(created.body.booking).toEqual(booking);
    });

    await test.step('read the booking back', async () => {
      const fetched = await client.getBooking(bookingId!);
      expect(fetched.status).toBe(200);
      expect(fetched.body).toEqual(booking);
    });

    const updated: Booking = {
      ...booking,
      firstname: `${booking.firstname}X`,
      totalprice: 480,
      depositpaid: false,
      additionalneeds: 'Late checkout',
      bookingdates: { checkin: '2026-08-10', checkout: '2026-08-12' },
    };

    await test.step('replace the booking', async () => {
      const put = await client.updateBooking(bookingId!, updated, token);
      expect(put.status).toBe(200);
      expect(put.body).toEqual(updated);
    });

    await test.step('read the updated booking', async () => {
      const fetched = await client.getBooking(bookingId!);
      expect(fetched.status).toBe(200);
      expect(fetched.body).toEqual(updated);
    });

    await test.step('delete the booking', async () => {
      const deleted = await client.deleteBooking(bookingId!, token);
      // Documented success status. The next step proves the record is gone.
      expect(deleted.status).toBe(201);
    });

    await test.step('the booking is gone', async () => {
      const fetched = await client.getBooking(bookingId!);
      expect(fetched.status).toBe(404);
      bookingId = undefined;
    });
  } finally {
    if (bookingId !== undefined && token) {
      await client.deleteBooking(bookingId, token);
    }
  }
});
