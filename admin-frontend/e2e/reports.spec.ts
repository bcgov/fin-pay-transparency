import { expect, test } from '@playwright/test';
import { SearchReportsPage } from './pages/reports/search-reports-page';

test.describe('Reports', () => {
  test('search reports', async ({ page }) => {
    const { searchReportsPage: reportsPage, reports } =
      await SearchReportsPage.visit(page);
    const title = reports[0].pay_transparency_company.company_name;
    await reportsPage.searchAndVerifyReports(title, false);
  });

  test.describe.serial('lock and unlock report', async () => {
    test('lock', async ({ page }) => {
      const { searchReportsPage: reportsPage } =
        await SearchReportsPage.visit(page);
      const reports = await reportsPage.filterReports(true);
      expect(reports.length).toBeGreaterThan(0);
      const title = reports[0].pay_transparency_company.company_name;
      const report = await reportsPage.searchAndVerifyReports(title);
      await reportsPage.toggleReportLockAndverify(report);
    });

    test('unlock', async ({ page }) => {
      const { searchReportsPage: reportsPage } =
        await SearchReportsPage.visit(page);
      const reports = await reportsPage.filterReports(false);
      expect(reports.length).toBeGreaterThan(0);
      const title = reports[0].pay_transparency_company.company_name;
      const report = await reportsPage.searchAndVerifyReports(title);
      await reportsPage.toggleReportLockAndverify(report);
    });
  });
});
