import { expect, Locator, Page } from 'playwright/test';
import { AdminPortalPage } from '../admin-portal-page';
import { PagePaths } from '../../utils';
import { groupBy } from 'lodash';

// Define types for the page object
type Report = {
  report_id: string;
  naics_code: string;
  report_start_date: string;
  report_end_date: string;
  report_status: string;
  create_date: string;
  update_date: string;
  reporting_year: string;
  is_unlocked: boolean;
  admin_last_access_date: string;
  employee_count_range: {
    employee_count_range_id: string;
    employee_count_range: string;
  };
  pay_transparency_company: {
    company_id: string;
    company_name: string;
  };
};

type DisplayedReportRow = {
  submissionDate: string;
  employerName: string;
  naics: string;
  employeeCount: string;
  year: string;
  isLocked: boolean; // true if "unlock report" button is present, false if "lock report" button is present
};

export class SearchReportsPage extends AdminPortalPage {
  static PATH = PagePaths.REPORTS;
  searchInput: Locator;
  searchButton: Locator;
  resetButton: Locator;
  filterButton: Locator;
  reportYearFilterInput: Locator;
  lockFilterInput: Locator;
  applyFilterButton: Locator;
  openReportButton: Locator;
  lockReportButton: Locator;
  withdrawReportButton: Locator;
  reportHistoryButton: Locator;
  noReportsLocator: Locator;
  confirmDialogButton: Locator;
  tableRows: Locator;
  loadingRow: Locator;

  static async visit(page: Page): Promise<SearchReportsPage> {
    await page.goto(SearchReportsPage.PATH);
    const searchReportsPage = new SearchReportsPage(page);
    await searchReportsPage.setup();
    return searchReportsPage;
  }

  async setup(): Promise<void> {
    super.setup();
    this.searchInput = await this.page.getByLabel('Search by employer name');
    this.searchButton = await this.page.getByRole('button', { name: 'Search' });
    this.resetButton = await this.page.getByRole('button', { name: 'Reset' });
    this.filterButton = await this.page.getByRole('button', { name: 'Filter' });
    this.reportYearFilterInput = await this.page.getByLabel('Report Year');
    this.lockFilterInput = await this.page.getByLabel('Locked/Unlocked');
    this.applyFilterButton = await this.page.getByRole('button', {
      name: 'Apply',
    });
    this.openReportButton = await this.page.getByRole('button', {
      name: 'Open report',
    });
    this.lockReportButton = await this.page.getByRole('button', {
      name: 'Lock report',
    });
    this.withdrawReportButton = await this.page.getByRole('button', {
      name: 'Withdraw report',
    });
    this.reportHistoryButton = await this.page.getByRole('button', {
      name: 'Admin action history',
    });
    this.noReportsLocator = await this.page.getByText(
      'No reports matched the search criteria',
    );

    this.confirmDialogButton = await this.page.getByRole('button', {
      name: 'Yes',
    });

    // Locator for all table rows (excluding header)
    const table = await this.page.locator('table').first();
    this.tableRows = table.locator('tbody tr');

    // Locator for the loading row
    this.loadingRow = this.page.getByText('Loading items...');

    await expect(this.searchInput).toBeVisible();
    await expect(this.searchButton).toBeVisible();
    await expect(this.filterButton).toBeVisible();
  }

  async getDisplayedReports(): Promise<DisplayedReportRow[]> {
    // If the 'No reports matched the search criteria' message is visible, return an empty array
    if (await this.noReportsLocator.isVisible()) {
      return [];
    }

    // Wait for the table to finish loading: wait for 'Loading items...' row to disappear
    await this.loadingRow.waitFor({ state: 'detached' });

    // Get all table rows (excluding header)
    const rows = await this.tableRows.all();

    const reports: DisplayedReportRow[] = [];

    for (const row of rows) {
      const cells = await row.locator('td').all();

      if (cells.length >= 5) {
        // Extract data from the first 5 columns: Submission Date, Employer Name, NAICS, Employee Count, Year
        const submissionDate = await cells[0].textContent();
        const employerName = await cells[1].textContent();
        const naics = await cells[2].textContent();
        const employeeCount = await cells[3].textContent();
        const year = await cells[4].textContent();

        // Determine lock status by checking which button is present in the row
        const unlockButton = row.getByRole('button', { name: 'Unlock report' });
        const isLocked = await unlockButton.isVisible();

        // Create a report row object from the displayed data
        const reportRow: DisplayedReportRow = {
          submissionDate: submissionDate?.trim() || '',
          employerName: employerName?.trim() || '',
          naics: naics?.trim() || '',
          employeeCount: employeeCount?.trim() || '',
          year: year?.trim() || '',
          isLocked: isLocked,
        };

        reports.push(reportRow);
      }
    }

    return reports;
  }

  // === PAGE MODIFICATION FUNCTIONS ===

  async searchReports(companyName: string) {
    await this.searchInput.fill(companyName);
    await this.clickSearchButton();
  }

  async reset() {
    // Only click the Reset button if it is enabled
    if (await this.resetButton.isEnabled()) {
      await this.resetButton.click();
    }
  }

  async clickSearchButton() {
    const searchResponse = SearchReportsPage.waitForSearchResults(this.page);
    await this.searchButton.click();
    await searchResponse; // Wait for the search to complete
  }

  async toggleFilterDisplay() {
    await this.filterButton.click();
  }

  /**
   *
   * @param year The year to filter by, or null/undefined for "any"
   */
  async setFilterYear(year?: number | null) {
    await this.reportYearFilterInput.click({ force: true, button: 'right' });
    await this.page.waitForTimeout(2000);

    if (year === null || year === undefined) {
      // Select first option which is "any"
      const anyOption = await this.page.getByLabel('Year: Any').first();
      await anyOption.click();
    } else {
      const option = await this.page.getByLabel(`Year: ${year}`);
      await option.click();
    }
  }

  /**
   *
   * @param findLocked The status to filter by, or null/undefined for "any"
   */
  async setFilterLocked(findLocked?: boolean | null) {
    await this.lockFilterInput.click({ force: true, button: 'right' });
    await this.page.waitForTimeout(2000);

    if (findLocked == null) {
      // Select first option which is "any"
      const anyOption = await this.page
        .getByText('Any', { exact: true })
        .first();
      await anyOption.click();
    } else {
      const lockStatus = findLocked ? 'Locked' : 'Unlocked';
      const lockOption = await this.page.getByText(lockStatus, { exact: true });
      await lockOption.click();
    }
  }

  async applyFilter() {
    const filterResponse = SearchReportsPage.waitForSearchResults(this.page);
    await this.applyFilterButton.click();
    await filterResponse;
  }

  async toggleReportLock(rowNumber: number) {
    // Find the specific row by row number (0-based index)
    const targetRow = this.tableRows.nth(rowNumber);

    // Get the toggle button for locking/unlocking the report
    let toggleButton = targetRow.getByRole('button', {
      name: 'Unlock report',
    });
    if (!(await toggleButton.isVisible())) {
      toggleButton = targetRow.getByRole('button', {
        name: 'Lock report',
      });
    }
    const response = SearchReportsPage.waitForActionResult(this.page);
    await toggleButton.click();
    await this.confirmDialogButton.click();
    await response;
  }

  async withdrawReport(rowNumber: number) {
    const targetRow = this.tableRows.nth(rowNumber);
    const response = SearchReportsPage.waitForActionResult(this.page);
    await targetRow.getByRole('button', { name: 'Withdraw report' }).click();
    await this.confirmDialogButton.click();
    await response;
  }

  // === PAGE VERIFICATION FUNCTIONS ===

  async verifyReportButtons() {
    await expect(this.openReportButton.first()).toBeVisible();
    await expect(this.lockReportButton.first()).toBeVisible();
    await expect(this.withdrawReportButton.first()).toBeVisible();
    await expect(this.reportHistoryButton.first()).toBeVisible();
  }

  async verifyFilterDisplayed() {
    await expect(this.reportYearFilterInput).toBeVisible();
    await expect(this.lockFilterInput).toBeVisible();
    await expect(this.applyFilterButton).toBeVisible();
  }

  async verifyFilterHidden() {
    await expect(this.reportYearFilterInput).not.toBeVisible();
    await expect(this.lockFilterInput).not.toBeVisible();
    await expect(this.applyFilterButton).not.toBeVisible();
  }

  async verifyAllReportsHaveSameEmployer(
    reports: DisplayedReportRow[],
    expectedEmployerName: string,
  ) {
    expect(reports.length).toBeGreaterThan(0);
    for (const report of reports) {
      expect(report.employerName).toBe(expectedEmployerName);
    }
  }

  async verifyDisplayedReportsLockStatus(isLocked: boolean) {
    const actualReports = await this.getDisplayedReports();
    expect(actualReports.length).toBeGreaterThan(0);
    for (const report of actualReports) {
      expect(report.isLocked).toBe(isLocked);
    }
  }

  async verifySearchResultsMatch(expectedReports: DisplayedReportRow[]) {
    // Get the actual displayed reports from the page
    const actualReports = await this.getDisplayedReports();
    await expect(actualReports).toMatchObject(expectedReports);
  }

  // === UTILITY FUNCTIONS ===

  static waitForSearchResults(page) {
    return page.waitForResponse((res) => {
      return (
        res.url().includes('/admin-api/v1/reports') && res.status() === 200
      );
    });
  }

  static waitForActionResult(page) {
    return page.waitForResponse((res) => {
      return (
        res.url().includes('/admin-api/v1/reports') &&
        res.status() === 200 &&
        res.request().method() === 'PATCH'
      );
    });
  }
}
