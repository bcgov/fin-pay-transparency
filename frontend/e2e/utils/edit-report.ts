import { Page } from '@playwright/test';
import { PagePaths } from '.';
import { DashboardPage } from '../pages/dashboard';
import { GenerateReportPage } from '../pages/generate-report';
import { DraftReportPage, PublishedReportPage } from '../pages/report';
import { waitForUserAndReports } from './report';

export const editReport = async (page: Page) => {
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

  const { reportDetails } = await dashboard.gotoEditReport(
    reportId,
    editReportButton,
  );

  const formPage = new GenerateReportPage(dashboard.instance);
  await formPage.setup();
  await formPage.checkDefaultFormValues(reportDetails);

  // edit form and submit form
  let report = await formPage.editReportAndSubmit(reportDetails);

  const draftReportPage = new DraftReportPage(formPage.instance, user);
  await draftReportPage.setup();
  await draftReportPage.verifyEmployeerDetails(user, null);
  report = await draftReportPage.finalizedReport(reportId);

  const publishedReportPage = new PublishedReportPage(page, user);
  await publishedReportPage.setup();
  await publishedReportPage.verifyUser(user);
  await publishedReportPage.verifyEmployeerDetails(user, report);
};
