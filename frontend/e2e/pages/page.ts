import { Locator, Page, expect } from '@playwright/test';
import { PagePaths } from '../utils';

export type User = {
  displayName: string;
  legalName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  country: string;
  postal: string;
};

export class PTPage {
  public accountButton: Locator;
  constructor(public readonly instance: Page) {}

  async setup() {
    this.accountButton = await this.instance.getByTestId(
      'header-account-button',
    );
  }

  async verifyUser(user: User) {
    await expect(this.accountButton).toBeVisible();
    await this.accountButton.click();
    const displayName = await this.instance.getByTestId('header-display-name');
    await expect(displayName).toBeVisible();
    await expect(displayName).toContainText(user.displayName);
    const legalName = await this.instance.getByTestId('header-legal-name');
    await expect(legalName).toBeVisible();
    await expect(legalName).toContainText(user.legalName);
  }

  async logout() {
    try {
      await expect(this.accountButton).toBeVisible();
      await this.accountButton.click();
      const logoutButton = await this.instance.getByTestId(
        'header-logout-button',
      );
      await expect(logoutButton).toBeVisible();
      await logoutButton.click();
      await this.instance.waitForTimeout(1000);
      await this.instance.waitForURL(PagePaths.LOGOUT);
    } catch (error) {
      console.log(error);
    }
  }
}
