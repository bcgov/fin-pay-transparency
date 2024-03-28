import { test } from '@playwright/test';
import { DashboardPage } from './pages/dashboard';
import { GenerateReportPage } from './pages/generate-report';
import { PagePaths } from './utils';

test('generate new report', async ({ page }) => {
  // 1: Click generate report button from the dashboard page
  await page.goto(PagePaths.DASHBOARD);
  const dashboard = new DashboardPage(page);
  await dashboard.setup();
  await dashboard.gotoGenerateReport();

  // const generateReportPage = new GenerateReportPage(dashboard.instance);
  // await generateReportPage.fillOutForm({
  //   naicsCode: '11 - Agriculture, forestry, fishing and hunting',
  //   employeeCountRange: '50-299',
  //   comments: 'Example test comment',
  //   dataConstraints: 'Example data constraint text',
  //   fileName: 'CsvGood.csv',
  // });
  // await generateReportPage.submitForm();
});
