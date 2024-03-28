import { test } from '@playwright/test';
import { PagePaths } from './utils';
import { PTPage } from './pages/page';

test('logout', async ({ page }) => {
  await page.goto(PagePaths.DASHBOARD);
  const instance = new PTPage(page);
  await instance.setup();
  await instance.logout();
});
