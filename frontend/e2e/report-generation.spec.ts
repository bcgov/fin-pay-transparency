import { test } from './playwright/fixtures';
import { generateReport } from './utils/generate-report';
import { checkDashboardReports } from './utils/check-dashboard-reports';
import { editReport } from './utils/edit-report';

test.describe.serial('report generation', () => {
  test('generate new report', async ({ page }) => {
    await generateReport(page);
  });

  test('verify that reports in dashboard', async ({ page }) => {
    await checkDashboardReports(page);
  });

  test('edit report', async ({ page }) => {
    await editReport(page);
  });
});
