import { test as setup } from '@playwright/test';
import { DashboardPage } from './pages/dashboard';
import { LoginPage } from './pages/login';
import { PagePaths } from './utils/index';

const authFile = 'user.json';

export interface User {
  displayName: string;
}

setup('authenticate', async ({ page }) => {
  await page.goto(PagePaths.LOGIN);
  const loginPage = new LoginPage(page);

  const [response] = await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes('/admin-api/user') && res.status() === 200,
    ),
    loginPage.login(),
  ]);

  const user = await response.json();

  await page.goto(PagePaths.DASHBOARD);
  const dashboard = new DashboardPage(loginPage.page);
  await dashboard.validatePage();
  await dashboard.verifyUserIsDisplayed(user);

  await page.context().storageState({ path: authFile });
});
