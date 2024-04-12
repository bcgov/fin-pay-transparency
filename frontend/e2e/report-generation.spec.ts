import { expect, test } from '@playwright/test';
import { DashboardPage } from './pages/dashboard';
import {
  GenerateReportPage,
  IEmployeeCountRange,
  INaicsCode,
  IReportDetails,
} from './pages/generate-report';
import { PagePaths } from './utils';
import { DraftReportPage, PublishedReportPage } from './pages/report';
import { PTPage } from './pages/page';

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
    const generateReportPage = new GenerateReportPage(dashboard.instance);
    await generateReportPage.setup();
    await generateReportPage.verifyUser(user);

    /***************** TEST FORM VALIDATION  *********************/
    await generateReportPage.submitForm();
    await generateReportPage.checkErrors();

    /*************************************************************/

    /***************** FILL OUT FORM / BAD CSV  ******************/
    await generateReportPage.naicsInput.scrollIntoViewIfNeeded();
    await generateReportPage.fillOutForm({
      naicsCode: '11 - Agriculture, forestry, fishing and hunting',
      employeeCountRange: '50-299',
      comments: 'Example test comment',
      dataConstraints: 'Example data constraint text',
      fileName: 'CsvWithErrors.csv',
    });

    const badUploadFileResponse = generateReportPage.instance.waitForResponse(
      (res) =>
        res.url().includes('/api/v1/file-upload') && res.status() === 400,
    );
    await generateReportPage.submitForm();
    const errorResponse = await badUploadFileResponse;
    let errors = await errorResponse.json();
    await generateReportPage.validateUploadRowValues(errors.error);

    const validUploadFileResponse = generateReportPage.instance.waitForResponse(
      (res) =>
        res.url().includes('/api/v1/file-upload') && res.status() === 200,
    );
    await generateReportPage.selectFile('CsvGood.csv');
    await generateReportPage.submitForm();
    const validResponse = await validUploadFileResponse;
    let validUploadResponse = await validResponse.json();
    await page.waitForURL(PagePaths.DRAFT_REPORT);
    /*************************************************************/

    /*********************DRAFT REPORT PREVIEW******************************/
    const draftReportPage = new DraftReportPage(page);
    await draftReportPage.setup();
    await draftReportPage.verifyUser(user);
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
    const publishedReportPage = new PublishedReportPage(page);
    await publishedReportPage.setup();
    await publishedReportPage.verifyUser(user);
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

  test('edit report', async ({ page }) => {
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
    const { report_id: reportId } = reports.find((r) => r.is_unlocked);
    const editButton = await dashboard.canEditReport(reportId);

    const getReportDetailsRequest = dashboard.instance.waitForResponse(
      (res) =>
        res.url().includes('/api/v1/report/' + reportId) &&
        res.status() === 200,
    );
    const getEmployeeCountRangesRequest = dashboard.instance.waitForResponse(
      (res) =>
        res.url().includes('/api/v1/codes/employee-count-ranges') &&
        res.status() === 200,
    );
    const getNaicsCodesRequest = dashboard.instance.waitForResponse(
      (res) =>
        res.url().includes('/api/v1/codes/naics-codes') && res.status() === 200,
    );
    await editButton.click();
    await dashboard.instance.waitForURL(PagePaths.GENERATE_REPORT);
    const getReportDetailsResponse = await getReportDetailsRequest;
    const reportDetails: IReportDetails = await getReportDetailsResponse.json();
    const getEmployeeCountRangesResponse = await getEmployeeCountRangesRequest;
    const employeeCountRanges: IEmployeeCountRange[] =
      await getEmployeeCountRangesResponse.json();
    const getNaicsCodesResponse = await getNaicsCodesRequest;
    const naicsCodes: INaicsCode[] = await getNaicsCodesResponse.json();

    PTPage.employeeCountRanges = employeeCountRanges;
    PTPage.naicsCodes = naicsCodes;
    const formPage = new GenerateReportPage(dashboard.instance);
    await formPage.setup();
    await formPage.verifyUser(user);
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

    const draftReportPage = new DraftReportPage(formPage.instance);
    await draftReportPage.setup();
    await draftReportPage.verifyEmployeerDetails(user, null)
    await draftReportPage.finalizedReport(validUploadResponse.report_id);
    
    const publishedReportPage = new PublishedReportPage(page);
    await publishedReportPage.setup();
    await publishedReportPage.verifyUser(user);
    await publishedReportPage.verifyEmployeerDetails(user, validUploadResponse);
  });
});
