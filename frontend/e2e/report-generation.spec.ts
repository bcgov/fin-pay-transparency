import { expect, test } from '@playwright/test';
import { DashboardPage } from './pages/dashboard';
import { GenerateReportPage } from './pages/generate-report';
import { PagePaths } from './utils';
import { DraftReportPage, PublishedReportPage } from './pages/report';
import { waitForApiResponses, waitForUserAndReports } from './utils/report';
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
