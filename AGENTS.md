# Інструкції для агента

Проєкт перевіряє [SauceDemo](https://www.saucedemo.com) (UI, Playwright + TypeScript) і [Restful-Booker](https://restful-booker.herokuapp.com/apidoc) (API через Playwright `request`). Людська документація — українською. Код, назви тестів і селектори — англійською.

## Запуск

- `npm test` — UI і API
- `npm run test:ui` / `npm run test:api`
- `npm run typecheck`
- Не лишати `test.only`. У CI увімкнено `forbidOnly`.

## Де що лежить

- `src/ui/pages` — page objects
- `src/api/booker-client.ts` — HTTP-клієнт
- `src/config.ts` — публічні демо-облікові дані. Це не секрети, в CI їх не виносити і токен не логувати
- `tests/ui`, `tests/api` — сценарії
- `tests/**/known-defects.spec.ts` — уже підтверджені дефекти продукту

## Селектори SauceDemo

- Тестовий атрибут — `data-test`, не `data-testid`. У конфігу виставлено `testIdAttribute: 'data-test'`.
- Не збирати slug кнопки Add to cart з назви товару. У `Test.allTheThings() T-Shirt (Red)` він крихкий. Клікати `inventory-item locator('button')`: поруч є два посилання з `role="button"` («View details for …»), і голий `getByRole('button')` ловить усі три.
- Доступне ім'я кошика змінюється («Cart, empty», далі лічильник). Шукати `shopping-cart-link`.
- Вихід: кнопка `Open Menu`, потім кнопка `Logout`. Пункт меню має роль button, не link. Атрибут `open-menu` клік не приймає.
- На картці товару каталог лишається в DOM. Спершу чекати `back-to-products`, назву й ціну брати з `filter({ visible: true })`.

## Як писати тести

- Кожен тест має власний browser context. Не ділити логін і кошик між тестами через спільну сторінку.
- Без `waitForTimeout`. Чекати на URL, текст або лічильник.
- Звичайний тест перевіряє коректну поведінку. Якщо продукт із нею розходиться, не підганяти асерт під баг: винести відтворення в `known-defects` і описати його в README.
- У `known-defects` викликати `test.fail(умова, 'BUG-…')` перед асертом правильної поведінки. Поки дефект є, прогін зелений; коли його виправлять, тест стає звичайним зеленим тестом.
- Перед висновком «це баг API» звірити відповідь з [apidoc](https://restful-booker.herokuapp.com/apidoc). Успішне `DELETE /booking/:id` там задокументоване як `201 Created`. Доказ видалення — наступний `GET` зі статусом 404.
- Токен передавати заголовком `Cookie: token=<token>`.
- `Accept: application/json` уже стоїть на API-проєкті. `Content-Type` для тіла виставляє Playwright.
- Кожне створене бронювання видаляти в `finally`, навіть якщо асерт упав.
- Ім'я гостя брати з `buildBooking`: стенд спільний.
- Негативний тест перевіряє наслідок (немає токена, немає `bookingid`, запис не змінився), а не випадковий текст помилки сервера.
- Якщо тест упав, спершу відділити дефект продукту від помилки тесту. Не послаблювати асерт лише щоб прогін позеленів.
