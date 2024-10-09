import { expect, Locator, Page } from '@playwright/test';
import { PagePaths } from '../utils';
import { AdminPortalPage } from './admin-portal-page';

export class DashboardPage extends AdminPortalPage {
  static path = PagePaths.DASHBOARD;
  public gotoAnnouncements: Locator;

  async setup() {
    await super.setup();
    this.gotoAnnouncements = await this.page.getByRole('link', {
      name: 'Go to edit',
    });

    const recentlyViewed = await this.page.getByRole('heading', {
      name: 'Recently Viewed Reports',
    });
    const recentlySubmitted = await this.page.getByRole('heading', {
      name: 'Recently Submitted Reports',
    });

    const analyticsView = await this.page.getByRole('heading', {
      name: 'Analytics Overview',
    });

    const currentYearReports = await this.page.getByText(
      `Number of reports submitted for the current reporting year (${new Date().getFullYear()})`,
    );

    const loggedInUsers = await this.page.getByText(
      'Total number of employers who have logged on to date',
    );

    const announcements = await this.page.getByRole('heading', {
      name: 'Public Announcements',
    });

    await expect(analyticsView).toBeVisible();
    await expect(recentlySubmitted).toBeVisible();
    await expect(loggedInUsers).toBeVisible();
    await expect(currentYearReports).toBeVisible();
    await expect(recentlyViewed).toBeVisible();
    await expect(announcements).toBeVisible();
    await expect(this.gotoAnnouncements).toBeVisible();
  }

  async clickGotoAnnouncementsAndVerify() {
    await this.gotoAnnouncements.click();
    await this.page.waitForURL(PagePaths.ANNOUNCEMENTS);
  }

  static async visit(page: Page): Promise<DashboardPage> {
    await page.goto(PagePaths.DASHBOARD);
    const dashboard = new DashboardPage(page);
    await dashboard.setup();
    return dashboard;
  }
}
