import { test } from '@playwright/test';
import { DashboardPage } from './pages/dashboard';
import { GenerateReportPage } from './pages/generate-report';
import { PagePaths } from './utils';
import {
  DraftReportPage,
  PublishedReportPage,
} from './pages/report';

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
    (res) => res.url().includes('/api/v1/file-upload') && res.status() === 400,
  );
  await generateReportPage.submitForm();
  const errorResponse = await badUploadFileResponse;
  let errors = await errorResponse.json();
  await generateReportPage.validateUploadRowValues(errors.error);

  const validUploadFileResponse = generateReportPage.instance.waitForResponse(
    (res) => res.url().includes('/api/v1/file-upload') && res.status() === 200,
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
  /***********************************************************************/
  const getReportsRequest = generateReportPage.instance.waitForResponse(
    (res) => res.url().includes('/api/v1/report') && res.status() === 200,
  );
  await page.goto(PagePaths.DASHBOARD);
  await getReportsRequest
  // Check if report is visible in the dashboard
  await dashboard.checkReport(validUploadResponse.report_id);
});
