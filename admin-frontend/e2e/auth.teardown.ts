import { test } from '@playwright/test';
import { PagePaths } from './utils';

test('logout', async ({ page }) => {
  await page.goto(PagePaths.LOGOUT);
});
