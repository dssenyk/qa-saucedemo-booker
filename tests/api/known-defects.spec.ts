import { expect, test } from '@playwright/test';
import { buildBooking, isCreatedBooking } from '../../src/api/booking';
import { BookerClient } from '../../src/api/booker-client';

/**
 * Expected behavior is asserted below. test.fail marks a defect that is still
 * open so the pipeline stays green. Write-ups are in README.md.
 */
test('invalid credentials are rejected with 401', async ({ request }) => {
  const client = new BookerClient(request);
  const auth = await client.authenticate('admin', 'wrong-password');

  test.fail(auth.status !== 401, 'BUG-API-1: failed auth returns HTTP 200');
  expect(auth.status).toBe(401);
});

test('a booking without required fields is a client error', async ({ request }) => {
  const client = new BookerClient(request);
  const created = await client.createBooking({ firstname: 'Only' });

  test.fail(created.status !== 400, 'BUG-API-2: missing required fields return HTTP 500');
  expect(created.status).toBe(400);
});

test('an impossible check-in date is rejected', async ({ request }) => {
  const client = new BookerClient(request);
  const auth = await client.authenticate();
  const created = await client.createBooking(
    buildBooking({
      bookingdates: { checkin: 'not-a-date', checkout: 'also-bad' },
    }),
  );
  const bookingId = isCreatedBooking(created.body) ? created.body.bookingid : undefined;

  try {
    test.fail(created.status !== 400, 'BUG-API-3: invalid dates are stored as 0NaN-aN-aN');
    expect(created.status).toBe(400);
  } finally {
    if (bookingId !== undefined && auth.token) {
      await client.deleteBooking(bookingId, auth.token);
    }
  }
});

test('a non-numeric total price is rejected', async ({ request }) => {
  const client = new BookerClient(request);
  const auth = await client.authenticate();
  const created = await client.createBooking({
    ...buildBooking(),
    totalprice: 'ten',
  });
  const bookingId = isCreatedBooking(created.body) ? created.body.bookingid : undefined;

  try {
    test.fail(created.status !== 400, 'BUG-API-4: a non-numeric totalprice is stored as null');
    expect(created.status).toBe(400);
  } finally {
    if (bookingId !== undefined && auth.token) {
      await client.deleteBooking(bookingId, auth.token);
    }
  }
});

test('deleting a missing booking reports that it is missing', async ({ request }) => {
  const client = new BookerClient(request);
  const auth = await client.authenticate();
  expect(auth.token).toBeTruthy();

  const deleted = await client.deleteBooking(0, auth.token);
  test.fail(deleted.status !== 404, 'BUG-API-5: deleting a missing booking returns HTTP 405');
  expect(deleted.status).toBe(404);
});
