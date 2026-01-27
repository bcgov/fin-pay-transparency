import { Page, expect, Locator } from '@playwright/test';
import { AdminPortalPage } from './admin-portal-page';
import { PagePaths } from '../utils';

export class AnalyticsPage extends AdminPortalPage {
  private readonly webTrafficAnalyticsButton: Locator;
  private readonly powerBiIframe: Locator;

  constructor(page: Page) {
    super(page);
    this.webTrafficAnalyticsButton = page.getByRole('link', {
      name: 'Web Traffic Analytics',
    });
    this.powerBiIframe = page.locator('iframe');
  }

  /**
   * Navigate to the Analytics page
   */
  async visit() {
    await this.page.goto(PagePaths.ANALYTICS);
  }

  /**
   * Verify the Web Traffic Analytics button is visible
   */
  async verifyWebTrafficAnalyticsButtonVisible(): Promise<void> {
    await expect(this.webTrafficAnalyticsButton).toBeVisible();
  }

  /**
   * Verify Web Traffic Analytics button opens a new tab
   */
  async verifyWebTrafficAnalyticsButtonOpenNewTab(): Promise<void> {
    const [newTab] = await Promise.all([
      this.page.waitForEvent('popup'),
      this.webTrafficAnalyticsButton.click(),
    ]);

    // Verify new tab opened
    expect(newTab).toBeTruthy();
  }

  /**
   * Wait for PowerBI report to load
   * This waits for the iframe to be present and have a src attribute
   */
  async waitForPowerBiReportToLoad(timeout: number = 30000): Promise<void> {
    await this.powerBiIframe.waitFor({ state: 'attached', timeout });

    // Wait for the iframe to have an embedUrl (src attribute)
    await expect(this.powerBiIframe).toHaveAttribute('src', /.+/, { timeout });
  }

  /**
   * Verify PowerBI report iframe is visible
   */
  async verifyPowerBiReportVisible(): Promise<void> {
    await expect(this.powerBiIframe).toBeVisible();
  }

  // Mock the API call to throw an error
  async mockApiError() {
    await this.page.route('**/admin-api/v1/analytics/embed**', (route) =>
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
      }),
    );
  }

  /**
   * Verify error notifications are displayed
   */
  async verifyErrorNotifications() {
    // Verify the error notification appears
    await expect(
      this.page.locator('text=Analytics failed to load'),
    ).toBeVisible();
  }

  /**
   * Verify no error notifications are displayed
   */
  async verifyNoErrorNotifications(): Promise<void> {
    const errorNotification = this.page.locator(
      '.v-snackbar--error, .notification-error',
    );
    await expect(errorNotification).not.toBeVisible();
  }
}
