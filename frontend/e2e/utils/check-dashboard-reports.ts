import { Page, expect } from "@playwright/test";
import { PagePaths } from ".";
import { DashboardPage } from "../pages/dashboard";
import { waitForUserAndReports } from "./report";

export const checkDashboardReports = async (page: Page) => {
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
}