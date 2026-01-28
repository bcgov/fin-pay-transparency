import { test } from '@playwright/test';
import { DashboardPage } from './pages/dashboard';

test.describe.serial('dashboard', () => {
  test('sidebar', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.visit();
    await dashboard.validatePage();
    await dashboard.verifySideBarVisible();
    await dashboard.verifySideBarLinks();
    await dashboard.verifySideBarExpandCollapse();
  });

  test('Go to edit announcements', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.visit();
    await dashboard.validatePage();
    await dashboard.clickGotoAnnouncementsAndVerify();
  });
});
