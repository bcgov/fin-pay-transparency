import { test, expect } from '@playwright/test';
import { PagePaths } from './utils';
import { DashboardPage } from './pages/dashboard';
import { GenerateReportPage } from './pages/generate-report';
import { PublishedReportPage } from './pages/report';

test.describe('Visual Regression', () => {
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboard = await DashboardPage.visit(page);
  });

  test('Dashboard', async ({ page }) => {
    await dashboard.stabilizeForVisualTesting('2020', 'February 1, 2020');
    await expect(page).toHaveScreenshot({ fullPage: true });
  });

  test('Form', async ({ page }) => {
    await dashboard.gotoGenerateReport();
    const generateReportPage = new GenerateReportPage(dashboard.instance);
    await generateReportPage.setup();
    await generateReportPage.stabilizeForVisualTesting(
      '2020',
      'Feb.',
      '2020',
      'Jan.',
      '2021',
    );
    await expect(page).toHaveScreenshot({ fullPage: true });
  });

  test('Report', async ({ page }) => {
    await dashboard.gotoFirstReport();
    const reportPage = new PublishedReportPage(page, '');
    await reportPage.setup();
    await reportPage.stabilizeForVisualTesting(
      '2020',
      'February 1, 2020 - January 31, 2021',
    );
    await expect(page).toHaveScreenshot({ fullPage: false }); //check floating buttons
  });

  test('Report Full', async ({ page }) => {
    await dashboard.gotoFirstReport();
    const reportPage = new PublishedReportPage(page, '');
    await reportPage.setup();
    await reportPage.stabilizeForVisualTesting(
      '2020',
      'February 1, 2020 - January 31, 2021',
    );
    await expect(page).toHaveScreenshot({ fullPage: true });
  });

  test('Login', async ({ page }) => {
    await page.goto(PagePaths.LOGIN);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot({ fullPage: true });
  });
});
