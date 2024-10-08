import { expect, Locator, Page } from 'playwright/test';
import { AdminPortalPage } from '../admin-portal-page';
import { PagePaths } from '../../utils';
import { groupBy } from 'lodash';

export class SearchReportsPage extends AdminPortalPage {
  static PATH = PagePaths.REPORTS;
  searchInput: Locator;
  searchButton: Locator;
  filterButton: Locator;

  static async visit(
    page: Page,
  ): Promise<{ searchReportsPage: SearchReportsPage; reports: any[] }> {
    const searchResponse = SearchReportsPage.waitForSearchResults(page);
    await page.goto(SearchReportsPage.PATH);
    const searchReportsPage = new SearchReportsPage(page);
    await searchReportsPage.setup();
    const response = await searchResponse;
    const { reports } = await response.json();
    return { searchReportsPage, reports };
  }

  async setup(): Promise<void> {
    super.setup();
    this.searchInput = await this.page.getByLabel('Search by company name');
    this.searchButton = await this.page.getByRole('button', { name: 'Search' });
    this.filterButton = await this.page.getByRole('button', {
      name: 'Filter',
    });
    await this.expectElementToBeVisible(this.searchInput);
    await this.expectElementToBeVisible(this.searchButton);
    await this.expectElementToBeVisible(this.filterButton);
  }

  async searchReports(companyName: string) {
    await this.searchInput.fill(companyName);
    return this.clickSearchButton();
  }

  async filterReports(is_unlocked: boolean) {
    await this.filterButton.click();
    const reportYearInput = await this.page.getByLabel('Report Year');
    const statusButton = await this.page.getByLabel('Locked/Unlocked');

    await expect(reportYearInput).toBeVisible();
    await expect(statusButton).toBeVisible();

    await reportYearInput.click({ force: true, button: 'right' });
    const currentYear = new Date().getFullYear();
    await this.page.waitForTimeout(2000);
    const option = await this.page.getByLabel(`Year: ${currentYear}`);
    await option.click();
    const lockStatus = is_unlocked ? 'Unlocked' : 'Locked';
    await this.page.waitForTimeout(2000);
    await statusButton.click({ force: true, button: 'right' });
    const lockOption = await this.page.getByText(lockStatus, { exact: true });
    await lockOption.click();

    const filterResponse = SearchReportsPage.waitForSearchResults(this.page);
    const applyButton = await this.page.getByRole('button', { name: 'Apply' });
    await applyButton.click();
    const response = await filterResponse;
    const { reports } = await response.json();

    return reports;
  }

  async clickSearchButton() {
    const searchResponse = SearchReportsPage.waitForSearchResults(this.page);
    await this.searchButton.click();
    const response = await searchResponse;
    const { reports } = await response.json();
    return reports;
  }

  async searchAndVerifyReports(companyName: string, validatedLength = true) {
    const reports = await this.searchReports(companyName);
    if (!validatedLength) {
      expect(reports.length).toBeGreaterThan(0);
    } else {
      expect(reports.length).toBe(1);
    }
    const report = reports[0];
    const { company_name } = report.pay_transparency_company;
    await this.expectElementToBeVisible(
      await this.page.getByText(company_name).first(),
    );
    await this.expectElementToBeVisible(
      await this.page.getByText(this.formatDate(report.create_date)).first(),
    );
    await this.expectElementToBeVisible(
      await this.page.getByText(report.naics_code).first(),
    );
    const employeeCount = report.employee_count_range.employee_count_range;
    await this.expectElementToBeVisible(
      await this.page.getByText(employeeCount).first(),
    );
    await this.expectElementToBeVisible(
      await this.page.getByText(report.reporting_year, { exact: true }).first(),
    );

    await this.expectElementToBeVisible(await this.getOpenReportButton());
    await this.expectElementToBeVisible(await this.getLockReportButton());
    await this.expectElementToBeVisible(await this.getReportHistoryButton());

    return report;
  }

  async toggleReportLockAndverify(report) {
    const lockButton = await this.getLockReportButton();
    const lockResponse = this.waitForReportLock(report.report_id);
    await lockButton.click();
    const confirmButton = await this.page.getByRole('button', {
      name: report.is_unlocked ? 'Yes, lock' : 'Yes, unlock',
    });
    await confirmButton.click();
    const response = await lockResponse;
    const patchedReport = await response.json();
    expect(patchedReport.is_unlocked).toBe(!report.is_unlocked);
  }

  private async getOpenReportButton() {
    const button = await this.page.getByRole('button', { name: 'Open report' });
    await this.expectElementToBeVisible(button.first());
    return button.first();
  }

  private async getLockReportButton() {
    const button = await this.page.getByRole('button', { name: 'Lock report' });
    await this.expectElementToBeVisible(button.first());
    return button.first();
  }

  private async getReportHistoryButton() {
    const button = await this.page.getByRole('button', {
      name: 'Admin action history',
    });
    await this.expectElementToBeVisible(button.first());
    return button.first();
  }

  static waitForSearchResults(page) {
    return page.waitForResponse((res) => {
      return (
        res.url().includes('/admin-api/v1/reports') && res.status() === 200
      );
    });
  }

  private waitForReportLock(reportId) {
    console.log(`/admin-api/v1/reports/${reportId}`);
    return this.page.waitForResponse((res) => {
      return (
        res.url().includes(`/admin-api/v1/reports/${reportId}`) &&
        res.status() === 200 &&
        res.request().method() === 'PATCH'
      );
    });
  }

  private waitForHistory(reportId) {
    return this.page.waitForResponse((res) => {
      return (
        res
          .url()
          .includes(`/admin-api/v1/reports/${reportId}/admin-action-history`) &&
        res.status() === 200
      );
    });
  }

  private async expectElementToBeVisible(element: Locator) {
    await expect(element).toBeVisible();
  }

  static getCompanyNameWithOneReport(reports, isUnlocked = true) {
    const groups = groupBy(reports, 'pay_transparency_company.company_name');
    console.log(
      Object.keys(groups).find(
        (key) =>
          groups[key].length === 1 && groups[key][0].is_unlocked === isUnlocked,
      ),
    );
    const companyName = Object.keys(groups).find(
      (key) =>
        groups[key].length === 1 && groups[key][0].is_unlocked === isUnlocked,
    );
    return companyName;
  }
}
