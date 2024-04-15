import { expect, test } from '@playwright/test';
import { DashboardPage } from './pages/dashboard';
import { GenerateReportPage } from './pages/generate-report';
import { PagePaths } from './utils';
import { DraftReportPage, PublishedReportPage } from './pages/report';
import { validateSubmitErrors, waitForApiResponses } from './utils/report';

test.describe.serial('report generation', () => {
  test('generate new report', async ({ page }) => {
    // 1: Click generate report button from the dashboard page
    await page.goto(PagePaths.DASHBOARD);
    const dashboard = new DashboardPage(page);
    await dashboard.setup();

    const getUserResponse = page.waitForResponse(
      (res) => res.url().includes('/api/user') && res.status() === 200,
    );
    await dashboard.gotoGenerateReport();
    const response = await getUserResponse;
    const user = await response.json();

    // verify employer details
    const generateReportPage = new GenerateReportPage(dashboard.instance, user);
    await generateReportPage.setup();

    /***************** TEST FORM VALIDATION  *********************/
    await generateReportPage.submitForm();
    await generateReportPage.checkErrors();

    /*************************************************************/

    /***************** FILL OUT FORM / BAD CSV  ******************/
    await validateSubmitErrors(generateReportPage);

    await generateReportPage.selectFile('CsvGood.csv');
    const validUploadResponse = await generateReportPage.submitForm(
      (res) =>
        res.url().includes('/api/v1/file-upload') && res.status() === 200,
    );

    await page.waitForURL(PagePaths.DRAFT_REPORT);
    /*************************************************************/

    /*********************DRAFT REPORT PREVIEW******************************/
    const draftReportPage = new DraftReportPage(page, user);
    await draftReportPage.setup();
    await draftReportPage.verifyEmployeerDetails(user, validUploadResponse);

    // Go Back
    await draftReportPage.backButton.scrollIntoViewIfNeeded();
    await draftReportPage.goBack();
    await generateReportPage.selectFile('CsvGood.csv');
    await generateReportPage.submitForm();
    await page.waitForURL(PagePaths.DRAFT_REPORT);
    /***********************************************************************/

    /***********************FINALIZE REPORT*********************************/
    await draftReportPage.finalizedReport(validUploadResponse.report_id);
    const publishedReportPage = new PublishedReportPage(page, user);
    await publishedReportPage.setup();
    await publishedReportPage.verifyEmployeerDetails(user, validUploadResponse);
  });

  test('verify that reports in dashboard', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const getUserResponse = dashboard.instance.waitForResponse(
      (res) => res.url().includes('/api/user') && res.status() === 200,
    );
    const getReportsRequest = dashboard.instance.waitForResponse(
      (res) => res.url().includes('/api/v1/report') && res.status() === 200,
    );
    await dashboard.instance.goto(PagePaths.DASHBOARD);
    await dashboard.setup();

    const response = await getUserResponse;
    const user = await response.json();
    const reportsResponse = await getReportsRequest;
    const reports = await reportsResponse.json();

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

  test.only('edit report', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const { user, reports } = await waitForApiResponses(
      {
        user: dashboard.instance.waitForResponse(
          (res) => res.url().includes('/api/user') && res.status() === 200,
        ),
        reports: dashboard.instance.waitForResponse(
          (res) => res.url().includes('/api/v1/report') && res.status() === 200,
        ),
      },
      async () => {
        await dashboard.instance.goto(PagePaths.DASHBOARD);
        await dashboard.setup();
      },
    );
    await dashboard.verifyUser(user);
    const { report_id: reportId } = reports.find((r) => r.is_unlocked);
    const editReportButton = await dashboard.canEditReport(reportId);

    const { reportDetails, naicsCodes, employeeCountRanges } =
      await dashboard.gotoEditReport(reportId, editReportButton);

    const formPage = new GenerateReportPage(dashboard.instance);
    await formPage.setup();
    await formPage.checkDefaultFormValues(reportDetails);

    // edit form and submit form
    const naicsCode = naicsCodes.find(
      (n) => n.naics_code !== reportDetails.naics_code,
    );
    await formPage.naicsInput.click();
    await formPage.setNaicsCode(
      `${naicsCode!.naics_code} - ${naicsCode!.naics_label}`,
    );
    const employeeCountRange = employeeCountRanges.find(
      (n) =>
        n.employee_count_range_id !== reportDetails.employee_count_range_id,
    );

    await formPage.setEmployeeCount(employeeCountRange!.employee_count_range);
    const comment = 'new comment edit';
    await formPage.commentsInput.fill(comment);
    const dataConstraint = 'new data constraint edit';
    await formPage.dataConstraintsInput.fill(dataConstraint);
    const validUploadFileResponse = formPage.instance.waitForResponse(
      (res) =>
        res.url().includes('/api/v1/file-upload') && res.status() === 200,
    );
    await formPage.selectFile('CsvGood.csv');
    await formPage.submitForm();
    await formPage.instance.waitForURL(PagePaths.DRAFT_REPORT);
    const validResponse = await validUploadFileResponse;
    let validUploadResponse = await validResponse.json();

    const draftReportPage = new DraftReportPage(formPage.instance, user);
    await draftReportPage.setup();
    await draftReportPage.verifyEmployeerDetails(user, null);
    await draftReportPage.finalizedReport(validUploadResponse.report_id);

    const publishedReportPage = new PublishedReportPage(page, user);
    await publishedReportPage.setup();
    await publishedReportPage.verifyUser(user);
    await publishedReportPage.verifyEmployeerDetails(user, validUploadResponse);
  });
});
