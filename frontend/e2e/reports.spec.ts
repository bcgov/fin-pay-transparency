import { test, expect } from '@playwright/test';
import { baseURL } from './utils';

test('generate new report', async ({ page }) => {
  await page.goto('/dashboard');
  const generateReportButton = page.getByText(
    'Generate Pay Transparency Report',
  );
  await expect(generateReportButton).toBeVisible();
  await generateReportButton.click();
  await page.waitForURL(baseURL + '/generate-report-form');
  await expect(page.getByText('Employer Details')).toBeVisible();
});
