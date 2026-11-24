import { expect, type Page } from '@playwright/test';

export class ShopHeader {
  constructor(private readonly page: Page) {}

  async openCart(): Promise<void> {
    await this.page.getByTestId('shopping-cart-link').click();
    await expect(this.page).toHaveURL(/\/cart\.html/);
  }

  async logout(): Promise<void> {
    await this.page.getByRole('button', { name: 'Open Menu' }).click();
    await this.page.getByRole('button', { name: 'Logout' }).click();
    await expect(this.page.getByTestId('login-button')).toBeVisible();
  }

  async expectBadge(count: number): Promise<void> {
    const badge = this.page.getByTestId('shopping-cart-badge');
    if (count === 0) {
      await expect(badge).toHaveCount(0);
      return;
    }
    await expect(badge).toHaveText(String(count));
  }

  async badgeCount(): Promise<number> {
    const badge = this.page.getByTestId('shopping-cart-badge');
    if ((await badge.count()) === 0) {
      return 0;
    }
    return Number(await badge.innerText());
  }
}
