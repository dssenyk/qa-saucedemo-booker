import { expect, test } from '@playwright/test';
import { buildBooking, isCreatedBooking } from '../../src/api/booking';
import { BookerClient } from '../../src/api/booker-client';

test('invalid credentials do not issue a token', async ({ request }) => {
  const client = new BookerClient(request);
  const auth = await client.authenticate('admin', 'wrong-password');

  expect(auth.token).toBeUndefined();
  expect(auth.body).toEqual({ reason: 'Bad credentials' });
});

test('an incomplete booking is not created', async ({ request }) => {
  const client = new BookerClient(request);
  const created = await client.createBooking({ firstname: 'Only' });

  expect(created.status).toBeGreaterThanOrEqual(400);
  expect(isCreatedBooking(created.body)).toBe(false);
});

test('anonymous edits are rejected and an unknown id is hidden', async ({ request }) => {
  const client = new BookerClient(request);
  const auth = await client.authenticate();
  expect(auth.token).toBeTruthy();

  const booking = buildBooking();
  const created = await client.createBooking(booking);
  expect(isCreatedBooking(created.body)).toBe(true);
  if (!isCreatedBooking(created.body)) {
    return;
  }

  const bookingId = created.body.bookingid;
  try {
    const deniedUpdate = await client.updateBooking(bookingId, {
      ...booking,
      firstname: 'Hacker',
    });
    expect(deniedUpdate.status).toBe(403);

    const deniedDelete = await client.deleteBooking(bookingId);
    expect(deniedDelete.status).toBe(403);

    const stillThere = await client.getBooking(bookingId);
    expect(stillThere.status).toBe(200);
    expect(stillThere.body).toEqual(booking);

    const missing = await client.getBooking(0);
    expect(missing.status).toBe(404);
  } finally {
    await client.deleteBooking(bookingId, auth.token);
  }
});
