import { test as setup } from '@playwright/test';
import { LoginPage } from './pages/login';
import { PagePaths } from './utils/index';

export interface User {
  displayName: string;
}

setup('authenticate', async ({ page }) => {
  await page.goto(PagePaths.LOGIN);
  const loginPage = new LoginPage(page);
  await loginPage.setup();
  await loginPage.login();

  const getUserResponse = page.waitForResponse(
    (res) => res.url().includes('/admin-api/user') && res.status() === 200,
  );
  const response = await getUserResponse;
  const user = await response.json();

  /*
  // Verify auth state
  await page.goto(PagePaths.DASHBOARD);
  const dashboard = new DashboardPage(loginPage.page);
  await dashboard.setup();
  await dashboard.verifyUserIsDisplayed(user);
*/

  await page.context().storageState({ path: 'user.json' });
});
