import { Page, expect } from '@playwright/test';
import { User } from '../auth.setup';
import { PagePaths } from '../utils';
import { DateTimeFormatter, ZonedDateTime, ZoneId } from '@js-joda/core';
import { Locale } from '@js-joda/locale_en';

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
    // TODO: bring it back after the
    // await expect(
    //   this.page.getByRole('link', { name: 'User Management' }),
    // ).toBeVisible();
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

  formatDate(
    inDateStr: string,
    inFormatter = DateTimeFormatter.ISO_DATE_TIME,
    outFormatter = DateTimeFormatter.ofPattern('MMM d, yyyy').withLocale(
      Locale.CANADA,
    ),
  ) {
    const date = ZonedDateTime.parse(inDateStr, inFormatter);
    const localTz = ZoneId.systemDefault();
    const dateInLocalTz = date.withZoneSameInstant(localTz);
    return outFormatter.format(dateInLocalTz);
  }
}
