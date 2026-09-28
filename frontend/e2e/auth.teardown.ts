import { test } from '@playwright/test';
import { PagePaths } from './utils';
import { PTPage } from './pages/page';
import { waitForApiResponses } from './utils/report';

test('logout', async ({ page }) => {
  await waitForApiResponses(
    {
      user: page.waitForResponse(
        (res) => res.url().includes('/api/user') && res.status() === 200,
      ),
    },
    async () => {
      await page.goto(PagePaths.DASHBOARD);
    },
  );
  const instance = new PTPage(page);
  await instance.setup();
  await instance.logout();
});
