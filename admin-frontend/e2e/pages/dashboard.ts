import { expect, Locator, Page } from '@playwright/test';
import { PagePaths } from '../utils';
import { AdminPortalPage } from './admin-portal-page';

export class DashboardPage extends AdminPortalPage {
  public gotoAnnouncements: Locator;
  public recentlyViewed: Locator;
  public recentlySubmitted: Locator;
  public analyticsView: Locator;
  public currentYearReports: Locator;
  public loggedInUsers: Locator;
  public announcements: Locator;

  constructor(page: Page) {
    super(page);
    this.gotoAnnouncements = page.getByRole('link', { name: 'Go to edit' });
    this.recentlyViewed = page.getByRole('heading', {
      name: 'Recently Viewed Reports',
    });
    this.recentlySubmitted = page.getByRole('heading', {
      name: 'Recently Submitted Reports',
    });
    this.analyticsView = page.getByRole('heading', {
      name: 'Analytics Overview',
    });
    this.currentYearReports = page.getByText(
      `Number of reports submitted for the current reporting year (${new Date().getFullYear()})`,
    );
    this.loggedInUsers = page.getByText(
      'Total number of employers who have logged on to date',
    );
    this.announcements = page.getByRole('heading', {
      name: 'Public Announcements',
    });
  }

  async validatePage() {
    await expect(this.analyticsView).toBeVisible();
    await expect(this.recentlySubmitted).toBeVisible();
    await expect(this.loggedInUsers).toBeVisible();
    await expect(this.currentYearReports).toBeVisible();
    await expect(this.recentlyViewed).toBeVisible();
    await expect(this.announcements).toBeVisible();
    await expect(this.gotoAnnouncements).toBeVisible();
  }

  async visit() {
    await this.page.goto(PagePaths.DASHBOARD);
  }

  async clickGotoAnnouncementsAndVerify() {
    await this.gotoAnnouncements.click();
    await this.page.waitForURL(PagePaths.ANNOUNCEMENTS);
  }
}
