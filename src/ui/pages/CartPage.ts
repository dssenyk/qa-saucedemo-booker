import { expect, type Locator, type Page } from '@playwright/test';
import { parsePrice } from '../money';
import { ShopHeader } from './ShopHeader';

export class CartPage {
  readonly header: ShopHeader;
  readonly title: Locator;

  constructor(private readonly page: Page) {
    this.header = new ShopHeader(page);
    this.title = page.getByTestId('title');
  }

  line(name: string): Locator {
    return this.page.getByTestId('inventory-item').filter({ hasText: name });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/cart\.html$/);
    await expect(this.title).toHaveText('Your Cart');
  }

  async names(): Promise<string[]> {
    return this.page.getByTestId('inventory-item-name').allInnerTexts();
  }

  async prices(): Promise<number[]> {
    const texts = await this.page.getByTestId('inventory-item-price').allInnerTexts();
    return texts.map(parsePrice);
  }

  async remove(name: string): Promise<void> {
    await this.line(name).locator('button').click();
    await expect(this.line(name)).toHaveCount(0);
  }

  async continueShopping(): Promise<void> {
    await this.page.getByTestId('continue-shopping').click();
    await expect(this.page).toHaveURL(/\/inventory\.html$/);
  }

  async checkout(): Promise<void> {
    await this.page.getByTestId('checkout').click();
    await expect(this.page).toHaveURL(/\/checkout-step-one\.html$/);
  }
}
