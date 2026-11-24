import { expect, type Locator, type Page } from '@playwright/test';
import { customer } from '../../config';
import { ShopHeader } from './ShopHeader';

type Customer = typeof customer;

export class CheckoutPage {
  readonly header: ShopHeader;
  readonly title: Locator;
  readonly error: Locator;
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly postalCode: Locator;

  constructor(private readonly page: Page) {
    this.header = new ShopHeader(page);
    this.title = page.getByTestId('title');
    this.error = page.getByTestId('error');
    this.firstName = page.getByTestId('firstName');
    this.lastName = page.getByTestId('lastName');
    this.postalCode = page.getByTestId('postalCode');
  }

  async fillCustomer(value: Customer): Promise<void> {
    await this.firstName.fill(value.firstName);
    await this.lastName.fill(value.lastName);
    await this.postalCode.fill(value.postalCode);
  }

  async continue(): Promise<void> {
    await this.page.getByTestId('continue').click();
  }

  async finish(): Promise<void> {
    await this.page.getByTestId('finish').click();
    await expect(this.page).toHaveURL(/\/checkout-complete\.html$/);
  }
}
