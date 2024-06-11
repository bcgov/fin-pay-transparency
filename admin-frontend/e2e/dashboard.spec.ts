import { test } from '@playwright/test';
import { DashboardPage } from './pages/dashboard';
import { PagePaths } from './utils';

test.describe.serial('dashboard', () => {
  test('sidebar', async ({ page }) => {
    await page.goto(PagePaths.DASHBOARD);
    const dashboard = new DashboardPage(page);
    await dashboard.setup();
    await dashboard.verifySideBarVisible();
    await dashboard.verifySideBarLinks();
    await dashboard.verifySideBarExpandCollapse();
  });
});
