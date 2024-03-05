import { expect, test } from '@playwright/test';
import { DashboardPage } from './pages/dashboard';

test('should display correct legal name', async ({ page }) => {
  const getUserPromise = page.waitForResponse('**/api/user');
  const getReports = page.waitForResponse(
    '**/api/v1/report/?report_status=Published',
  );
  const dashboardPage = new DashboardPage(page);
  const response = await getUserPromise;
  const data = await response.json();
  await expect(
    dashboardPage.instance.getByText(`Welcome, ${data.legalName}.`),
  ).toBeVisible();
  await getReports;
});

test('should display all published reports', async ({ page }) => {
  const getReports = page.waitForResponse(
    '**/api/v1/report/?report_status=Published',
  );
  const dashboardPage = new DashboardPage(page);

  const response = await getReports;
  const reports: any[] = await response.json();
  reports.forEach(async (report) => {
    await expect(
      dashboardPage.instance.getByTestId(
        `report_start_date-${report.report_id}`,
      ),
    ).toBeVisible();
    await expect(
      dashboardPage.instance.getByTestId(`report_end_date-${report.report_id}`),
    ).toBeVisible();
  });
});
