import { test as setup, expect } from '@playwright/test';
import { PagePaths, baseURL } from './utils/index';
const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await page.goto(`${baseURL!}${PagePaths.LOGIN}`);
  const loginButton = page.getByText('Log In with Business BCeID');
  await loginButton.click();
  await page.waitForTimeout(2000);
  const html = await page.locator('body').innerHTML();
  if (html.includes('Use a Business BCeID')) {
    expect(page.getByText('Use a Business BCeID'));
    await page.fill('#user', process.env.USERNAME!);
    await page.click('#password');
    await page.fill('#password', process.env.PASSWORD!);
    await page.waitForTimeout(1000);
    await page.locator('#login-form').press('Enter');
    await page.waitForURL(baseURL!);
    await expect(page.getByText('Generate Pay Transparency Report')).toBeVisible();
    await page.context().storageState({ path: authFile });
  }

});
