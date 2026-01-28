import { test } from '@playwright/test';
import { AnalyticsPage } from './pages/analytics.ts';

test.describe('Analytics Page', () => {
  test('Web Traffic Analytics button', async ({ page }) => {
    const analyticsPage = new AnalyticsPage(page);
    await analyticsPage.visit();
    await analyticsPage.verifyWebTrafficAnalyticsButtonVisible();
    await analyticsPage.verifyWebTrafficAnalyticsButtonOpenNewTab();
  });

  test('should display PowerBI embedded report without errors', async ({
    page,
  }) => {
    const analyticsPage = new AnalyticsPage(page);
    await analyticsPage.visit();
    await analyticsPage.waitForPowerBiReportToLoad();
    await analyticsPage.verifyPowerBiReportVisible();
    await analyticsPage.verifyNoErrorNotifications();
  });

  test('displays error when PowerBI API fails', async ({ page }) => {
    const analyticsPage = new AnalyticsPage(page);
    await analyticsPage.mockApiError();
    await analyticsPage.visit();
    await analyticsPage.verifyErrorNotifications();
  });
});
