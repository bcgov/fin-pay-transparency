import { expect, test } from '@playwright/test';
import { DashboardPage } from './pages/dashboard';
import { GenerateReportPage } from './pages/generate-report';
import { PagePaths } from './utils';
import { DraftReportPage, PublishedReportPage } from './pages/report';
import {
  waitForApiResponses,
  waitForUserAndReports,
} from './utils/report';

test.describe.serial('report generation', () => {
  test('generate new report', async ({ page }) => {
    // 1: Click generate report button from the dashboard page
    const dashboard = await DashboardPage.visit(page);

    const { user } = await waitForApiResponses(
      {
        user: page.waitForResponse(
          (res) => res.url().includes('/api/user') && res.status() === 200,
        ),
      },
      async () => await dashboard.gotoGenerateReport(),
    );

    // verify employer details
    const generateReportPage = new GenerateReportPage(dashboard.instance, user);
    await generateReportPage.setup();

    await generateReportPage.submitInvalidFormAndValidateErrors();
    const reportDetails = await generateReportPage.submitValidFormAndGotoDraftPage();

    const draftReportPage = await DraftReportPage.initialize(page, user)
    await draftReportPage.verifyEmployeerDetails(user, reportDetails);
    await draftReportPage.validateCanGoBack(generateReportPage);
    
    await draftReportPage.finalizedReport(reportDetails.report_id);
    const publishedReportPage = new PublishedReportPage(page, user);
    await publishedReportPage.setup();
    await publishedReportPage.verifyEmployeerDetails(user, reportDetails);
  });

  test('verify that reports in dashboard', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const { user, reports } = await waitForUserAndReports(
      dashboard.instance,
      async () => {
        await dashboard.instance.goto(PagePaths.DASHBOARD);
        await dashboard.setup();
      },
    );

    await dashboard.verifyUser(user);
    const { report_id: reportId, reporting_year: year } = reports.find(
      (r) => r.is_unlocked,
    );
    await expect(
      await dashboard.instance.getByTestId(`reporting_year-${reportId}`),
    ).toHaveText(year);
    expect(reportId).toBeDefined();
    await dashboard.checkReport(reportId);
    await dashboard.canEditReport(reportId);
  });

  test('edit report', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const { user, reports } = await waitForUserAndReports(
      dashboard.instance,
      async () => {
        await dashboard.instance.goto(PagePaths.DASHBOARD);
        await dashboard.setup();
      },
    );
    await dashboard.verifyUser(user);
    const { report_id: reportId } = reports.find((r) => r.is_unlocked);
    const editReportButton = await dashboard.canEditReport(reportId);

    const { reportDetails } =
      await dashboard.gotoEditReport(reportId, editReportButton);

    const formPage = new GenerateReportPage(dashboard.instance);
    await formPage.setup();
    await formPage.checkDefaultFormValues(reportDetails);

    // edit form and submit form
    const report = await formPage.editReportAndSubmit(reportDetails);

    const draftReportPage = new DraftReportPage(formPage.instance, user);
    await draftReportPage.setup();
    await draftReportPage.verifyEmployeerDetails(user, null);
    await draftReportPage.finalizedReport(report.report_id);

    const publishedReportPage = new PublishedReportPage(page, user);
    await publishedReportPage.setup();
    await publishedReportPage.verifyUser(user);
    await publishedReportPage.verifyEmployeerDetails(user, report);
  });
});
