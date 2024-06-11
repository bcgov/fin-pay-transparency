import { Page, expect } from '@playwright/test';
import { User } from '../auth.setup';
import { PagePaths } from '../utils';

export class AdminPortalPage {
  constructor(public readonly page: Page) {}

  async setup() {}

  async verifyUserIsDisplayed(user: User) {
    await expect(this.page.getByTestId('account-info')).toContainText(
      user.displayName,
    );
  }

  async verifySideBarVisible() {
    await expect(this.page.getByRole('navigation')).toBeVisible();
  }

  async verifySideBarLinks() {
    await expect(
      this.page.getByRole('link', { name: 'Dashboard' }),
    ).toBeVisible();
    await expect(
      this.page.getByRole('link', { name: 'Reports' }),
    ).toBeVisible();
    await expect(
      this.page.getByRole('link', { name: 'Announcements' }),
    ).toBeVisible();
    await expect(
      this.page.getByRole('link', { name: 'User Management' }),
    ).toBeVisible();
    await expect(
      this.page.getByRole('link', { name: 'Analytics' }),
    ).toBeVisible();
  }

  async verifySideBarExpandCollapse() {
    const initialIsCollapsed = await this.isSideBarCollapsed();
    await this.page.locator('#sidebar-rail-toggle-btn').click();
    expect(await this.isSideBarCollapsed()).toBe(!initialIsCollapsed);
    await this.page.locator('#sidebar-rail-toggle-btn').click();
    expect(await this.isSideBarCollapsed()).toBe(initialIsCollapsed);
  }

  async isSideBarCollapsed() {
    return (await this.page.$('nav.v-navigation-drawer--rail')) !== null;
  }

  async logout() {
    await this.page.getByRole('button', { name: 'Logout' }).click();
    await this.page.waitForTimeout(1000);
    await this.page.waitForURL(PagePaths.LOGOUT);
  }
}
