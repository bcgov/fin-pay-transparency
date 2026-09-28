import { Page } from '@playwright/test';
import { DashboardPage } from '../pages/dashboard';
import { GenerateReportPage } from '../pages/generate-report';
import { DraftReportPage, PublishedReportPage } from '../pages/report';
import { PagePaths } from '.';
import { waitForApiResponses } from './report';

export const generateReport = async (page: Page) => {
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
  const reportDetails =
    await generateReportPage.submitValidFormAndGotoDraftPage();

  const draftReportPage = await DraftReportPage.initialize(page, user);
  await draftReportPage.verifyEmployeerDetails(user, reportDetails);

  await draftReportPage.validateCanGoBack(generateReportPage);

  const report = await draftReportPage.finalizedReport(reportDetails.report_id);
  const publishedReportPage = new PublishedReportPage(page, user);
  await publishedReportPage.setup();
  await publishedReportPage.verifyEmployeerDetails(user, report);

  const reportsDashboard = new DashboardPage(page);
  await reportsDashboard.instance.goto(PagePaths.DASHBOARD);
  await reportsDashboard.setup();
  await reportsDashboard.manageReportUrlSequence(
    report.report_id,
    'https://example.gov.bc.ca/reports/first-link',
    'https://example.gov.bc.ca/reports/second-link',
  );
};
