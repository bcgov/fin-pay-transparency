import { test as setup } from '@playwright/test';
import { PagePaths } from './utils/index';
import { LoginPage } from './pages/login';
import { DashboardPage } from './pages/dashboard';

setup('authenticate', async ({ page }) => {
  await page.goto(PagePaths.LOGIN);
  const loginPage = new LoginPage(page);
  await loginPage.setup();
  const getUserResponse = page.waitForResponse(
    (res) => res.url().includes('/api/user') && res.status() === 200,
  );
  await loginPage.login();

  const response = await getUserResponse;
  const user = await response.json();

  // Verify auth state
  await page.goto(PagePaths.DASHBOARD);
  const dashboard = new DashboardPage(loginPage.instance);
  await dashboard.setup();
  await dashboard.verifyUser(user);
});
