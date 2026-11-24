# Automated tests for SauceDemo and Restful-Booker

UI checks for [SauceDemo](https://www.saucedemo.com) and API checks for [Restful-Booker](https://restful-booker.herokuapp.com/apidoc), written with Playwright and TypeScript. One runner, two projects: `ui` (Chromium) and `api` (`request`, no browser).

Local run on 24 Nov 2026: **22 tests, exit code 0**. Fourteen of them check working behavior and pass normally. The other eight live in `known-defects` and fail on purpose on the assertion of correct behavior: these are open product defects. `test.fail(...)` keeps them as expected failures, so CI stays green while the bug is present. When the product is fixed, the same test becomes an ordinary passing test.

## How to run

You need Node.js 20+ and network access to both stands.

```bash
npm ci
npx playwright install chromium
npm test
```

Separately:

```bash
npm run test:ui
npm run test:api
npm run test:headed
npm run report
npm run typecheck
```

Credentials are public and live in `src/config.ts`:

- SauceDemo: `standard_user` / `secret_sauce` (also `locked_out_user`, `problem_user`, `error_user`)
- Restful-Booker: `admin` / `password123`

CI does not need secrets. The booking stand is shared, so every created booking is deleted in `finally`, and the guest name is unique.

Checkout tax is calculated from the live order, not from a guess: backpack $29.99 + bike light $9.99 give an item total of $39.98, tax $3.20, total $43.18. That is 8% rounded half-up to the cent. The checkout test reads prices from the cart and checks the totals with the same formula.

## What is covered

### UI, user `standard_user`

| Test | What it checks |
| --- | --- |
| Successful login | After sign-in the Products catalog opens |
| Catalog | 6 products: unique names, a description, a price of `$d.dd`, distinct photos with no `sl-404`. The Backpack detail card matches the tile, and Back to products returns to the catalog |
| Sort by name | Name A→Z and Z→A, the active option label, and the row order |
| Sort by price | Price low→high and high→low. Equal prices of $15.99 may keep a stable order |
| Cart | Two products, badge 2, quantities of 1, removing one, badge 1, Continue Shopping restores the correct button labels |
| Checkout | The form, the overview (payment SauceCard #31337, shipping Free Pony Express, totals), "Thank you for your order!", and an empty cart |
| Session | Logout returns to the form. A direct `/inventory.html` without a session shows an access error and no products |

### UI, negative and boundary

- An empty username, then an empty password.
- An unknown password and `locked_out_user`. Both stay out of the catalog.
- Checkout with no First Name, then no Last Name, then no Postal Code. Each missing field stops the step, and the URL stays on `checkout-step-one`.

### API

One scenario, step by step: `POST /auth` → `POST /booking` → `GET` → `PUT` → `GET` checks the new fields → `DELETE` → `GET` returns 404.

Negative cases:

- a wrong password does not issue a token (`reason: Bad credentials`);
- a body that contains only `firstname` does not create a booking;
- `PUT` and `DELETE` without a token return 403, and the record is unchanged afterwards; `GET /booking/0` returns 404.

The token is sent as `Cookie: token=...`. A successful delete is documented in the official apidoc as **201 Created**, so the lifecycle expects 201, and the proof of deletion is the following 404.

## Left out on purpose

- `performance_glitch_user`: this is an artificial delay, not a functional check.
- `visual_user`, screenshot comparisons, and mobile layout.
- Firefox and WebKit. The local run and CI use Chromium only, so the job stays short and matches the browser where the defects were found.
- About, Dynamic Catalog, and the social links in the footer.
- Restful-Booker XML responses and the `Authorization: Basic` header. The documentation allows it alongside Cookie; Cookie is the one covered.
- `PATCH /booking/:id` and the `GET /booking?firstname=` filters. The update required by the assignment is covered by `PUT`.
- Load, races between two clients, and penetration testing.
- The bonus pipeline "test case text → Playwright test". It is outside the 4-hour limit.

Retries are enabled only in CI (`retries: 2`): Heroku sometimes wakes up slowly. Locally retries are off, so a flake is not hidden.

## CI

[`.github/workflows/tests.yml`](.github/workflows/tests.yml) runs `npx playwright test` on every `push` and `pull_request`.

After the run, including when tests fail, the `playwright-report` artifact (kept for 7 days) contains:

- the HTML report in `playwright-report/`
- `test-results/`: JUnit, plus screenshots and traces of failed tests

Locally the report opens with `npm run report`. In the console list, tests from `tests/**/known-defects.spec.ts` are marked `✘`: the assertion of correct behavior did not match. That is an expected failure, and the exit code stays 0. An unexpected failure of any other test turns the run red.

## Defects found

All of them were reproduced on 24 Nov 2026 on the public stands. Automated tests with the same ids live in `tests/ui/known-defects.spec.ts` and `tests/api/known-defects.spec.ts`.

### BUG-UI-1. `problem_user` shows the same photo for every product

**Severity:** medium. The catalog is readable, but the products cannot be told apart visually.

**Steps:**

1. Open https://www.saucedemo.com.
2. Sign in as `problem_user` / `secret_sauce`.
3. Look at the photos of the six cards.

**Expected result:** each product has its own image, as for `standard_user` (backpack, bike light, t-shirt, fleece jacket, onesie, red t-shirt).

**Actual result:** the `src` of all six `img` elements contains `sl-404`. The `alt` text is still correct: the image file is broken, not the label.

### BUG-UI-2. Sorting for `problem_user` changes neither the select nor the list

**Severity:** high for this user. The control looks like it works.

**Steps:**

1. Sign in as `problem_user` / `secret_sauce`.
2. In "Sort products", choose Price (high to low).

**Expected result:** the select value is `hilo`, the active label is "Price (high to low)", prices are descending, and the Fleece Jacket at $49.99 is first.

**Actual result:** the value stays `az`, the label stays "Name (A to Z)", and the Sauce Labs Backpack at $29.99 stays first. Name (Z to A) and Price (low to high) also leave the order untouched. For `standard_user` the same options work.

### BUG-UI-3. For `error_user` the badge and the buttons do not match the cart

**Severity:** high. The user sees 3 products and checks out 6.

**Steps:**

1. Open the site in a clean session (no cookies from another user).
2. Sign in as `error_user` / `secret_sauce`.
3. Click Add to cart on all six products, one after another.
4. Read the button labels and the badge number.
5. Open the cart.

**Expected result:** every button becomes Remove, the badge shows 6, and the cart has six lines.

**Actual result:**

- Remove appears only on Backpack, Bike Light, and Onesie.
- Bolt T-Shirt, Fleece Jacket, and Test.allTheThings() T-Shirt (Red) still say Add to cart.
- The badge shows 3.
- The cart contains all 6 products.

### BUG-API-1. A wrong password responds with HTTP 200

**Severity:** medium. A client that looks only at the status treats the login as successful.

**Steps:**

1. `POST https://restful-booker.herokuapp.com/auth`
2. Header `Content-Type: application/json`
3. Body: `{"username":"admin","password":"wrong-password"}`

**Expected result:** 401 and no token.

**Actual result:** 200 and `{"reason":"Bad credentials"}`. There is no token. An empty body `{}` gets the same response.

### BUG-API-2. An incomplete booking crashes the server with a 500

**Severity:** high. An invalid request should not become a 500.

**Steps:**

1. `POST /booking` with `Content-Type` and `Accept: application/json`
2. Body: `{"firstname":"Only"}`

**Expected result:** 400. The apidoc requires `firstname`, `lastname`, `totalprice`, `depositpaid`, `bookingdates.checkin`, and `bookingdates.checkout`. No booking is created.

**Actual result:** 500 and the text `Internal Server Error`. The response has no `bookingid`.

### BUG-API-3. An impossible date is stored as `0NaN-aN-aN`

**Severity:** high. A corrupted booking is written to the database.

**Steps:**

1. `POST /booking` with a valid name, price, and deposit.
2. `bookingdates.checkin` = `not-a-date`, `checkout` = `also-bad`.

**Expected result:** 400, and the record is not created.

**Actual result:** 200. In the stored booking both dates are `0NaN-aN-aN`.

The same validation hole was checked nearby and is not locked in as its own test:

- check-in `2026-05-10` and check-out `2026-05-01` are accepted with 200;
- `totalprice: -5` is accepted with 200;
- a first name and a last name of a single space are stored as empty strings.

### BUG-API-4. A string price is stored as `null`

**Severity:** high. The specification says `totalprice` has type Number.

**Steps:**

1. `POST /booking` with valid fields except `totalprice`.
2. Send `"totalprice": "ten"`.

**Expected result:** 400, and the record is not created.

**Actual result:** 200, and `totalprice` on the booking is `null`.

### BUG-API-5. Deleting a missing booking responds with 405

**Severity:** medium. A client cannot tell "no such id" from "method not allowed".

**Steps:**

1. `POST /auth` with `admin` / `password123` and take the token.
2. `DELETE /booking/0` with the header `Cookie: token=<token>`.

**Expected result:** 404. `GET /booking/0` already returns 404.

**Actual result:** 405 Method Not Allowed.

### BUG-API-6. `additionalneeds` is required in the specification, and the API does not require it

**Severity:** low. The documentation and the server disagree, and the happy path still works.

**Steps:**

1. `POST /booking` without `additionalneeds`. The other required fields are valid.

**Expected result:** a rejection. In the apidoc CreateBooking example the field is not marked optional.

**Actual result:** 200, and the created booking has no `additionalneeds` field.

There is no separate expected-failure test for this: it is a documentation mismatch, not corrupted data.

## Within the contract, not a defect

A successful `DELETE /booking/:id` is shown in the apidoc example as `HTTP/1.1 201 Created`. The live stand answers the same way, with the body `Created`. The lifecycle expects 201 and proves the deletion with the next `GET`, which returns 404.

`GET /ping` is also `201 Created` in that documentation. The endpoint is not part of this suite.
