import { Locator, Page, expect } from '@playwright/test';
import { PagePaths } from '../utils';
import { IEmployeeCountRange, INaicsCode } from './generate-report';

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
  public static naicsCodes: INaicsCode[] = [];
  public static employeeCountRanges: IEmployeeCountRange[] = [];
  constructor(
    public readonly instance: Page,
    public user = undefined,
  ) {}

  async setup() {
    this.accountButton = await this.instance.getByTestId(
      'header-account-button',
    );
    if (this.user) {
      await this.verifyUser(this.user);
    }
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
    await this.accountButton.click();
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
