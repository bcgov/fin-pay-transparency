import { test } from '@playwright/test';
import { DashboardPage } from './pages/dashboard';
import { PagePaths } from './utils';

test('update report', async ({ page }) => {
  const dashboard = new DashboardPage(page);
  const getUserResponse = dashboard.instance.waitForResponse(
    (res) => res.url().includes('/api/user') && res.status() === 200,
  );
  const getReportsRequest = dashboard.instance.waitForResponse(
    (res) => res.url().includes('/api/v1/report') && res.status() === 200,
  );
  await dashboard.instance.goto(PagePaths.DASHBOARD);
  await dashboard.setup();

  const response = await getUserResponse;
  const user = await response.json();
  const reportsResponse = await getReportsRequest;
  const reports = await reportsResponse.json();

  await dashboard.verifyUser(user);

  
});
