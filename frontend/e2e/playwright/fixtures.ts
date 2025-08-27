import { test as baseTest } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { PagePaths } from '../utils';
import { LoginPage } from '../pages/login';
import { DashboardPage } from '../pages/dashboard';

export * from '@playwright/test';
export const test = baseTest.extend<{}, { workerStorageState: string }>({
  // Use the same storage state for all tests in this worker.
  storageState: ({ workerStorageState }, use) => use(workerStorageState),

  // Authenticate once per worker with a worker-scoped fixture.
  workerStorageState: [
    async ({ browser, browserName, channel }, use) => {
      // Use parallelIndex as a unique identifier for each worker.
      const id = test.info().parallelIndex;
      const fileName = path.resolve(
        `.auth/${browserName + (channel ? `-${channel}` : '')}/${id}.json`,
      );

      if (fs.existsSync(fileName)) {
        // Reuse existing authentication state if any.
        await use(fileName);
        return;
      }

      // Important: make sure we authenticate in a clean environment by unsetting storage state.
      const page = await browser.newPage({ storageState: undefined });

      // Perform authentication steps.
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

      // End of authentication steps.

      await page.context().storageState({ path: fileName });
      await page.close();
      await use(fileName);
    },
    { scope: 'worker' },
  ],
});
