import { expect, test } from '@playwright/test';
import { SearchReportsPage } from './pages/reports/search-reports-page';

test.describe.serial('Reports', () => {
  test('should toggle filter visibility and reset page layout', async ({
    page,
  }) => {
    const reportsPage = await SearchReportsPage.visit(page);
    await reportsPage.verifyReportButtons();

    // Filter should be hidden initially
    await reportsPage.verifyFilterHidden();

    // Toggle filter to show it
    await reportsPage.toggleFilterDisplay();
    await reportsPage.verifyFilterDisplayed();

    // Reset to hide filter again
    await reportsPage.reset();
    await reportsPage.verifyFilterHidden();
  });

  test('should search by employer and show only matching reports', async ({
    page,
  }) => {
    const reportsPage = await SearchReportsPage.visit(page);

    // Get initial reports
    const initialReports = await reportsPage.getDisplayedReports();
    expect(initialReports.length).toBeGreaterThan(0);

    // Search for first employer
    const firstEmployerName = initialReports[0].employerName;
    await reportsPage.searchReports(firstEmployerName);

    // Get search results and verify all have the same employer
    const searchResults = await reportsPage.getDisplayedReports();
    await reportsPage.verifyAllReportsHaveSameEmployer(
      searchResults,
      firstEmployerName,
    );
  });

  test('should toggle lock on first report and reflect the change in the table', async ({
    page,
  }) => {
    const reportsPage = await SearchReportsPage.visit(page);
    // Get displayed reports
    const displayedReports = await reportsPage.getDisplayedReports();
    expect(displayedReports.length).toBeGreaterThan(0);

    // Lock that report using row number
    await reportsPage.toggleReportLock(0);

    // Verify the search results match our expected modified object
    displayedReports[0].isLocked = !displayedReports[0].isLocked;
    await reportsPage.verifySearchResultsMatch(displayedReports);
  });

  test('should filter and display only unlocked reports', async ({ page }) => {
    const reportsPage = await SearchReportsPage.visit(page);

    // Ensure there is at least one of each locked and unlocked report
    const allReports = await reportsPage.getDisplayedReports();
    if (
      !allReports.some((r) => r.isLocked) ||
      !allReports.some((r) => !r.isLocked)
    ) {
      await reportsPage.toggleReportLock(0);
    }

    // Toggle filter and set to search for unlocked reports
    await reportsPage.toggleFilterDisplay();
    await reportsPage.setFilterLocked(false); // false means unlocked
    await reportsPage.applyFilter();

    // Get displayed reports and verify they are all unlocked
    await reportsPage.verifyDisplayedReportsLockStatus(false);
  });
  /*
  test('should withdraw a report and reduce the report count', async ({
    page,
  }) => {
    const reportsPage = await SearchReportsPage.visit(page);

    // Get initial count of all reports
    const initialReports = await reportsPage.getDisplayedReports();
    const initialCount = initialReports.length;
    expect(initialCount).toBeGreaterThan(0); //This test requires at least one report to exist.
    // Withdraw the first report (row 0)
    await reportsPage.withdrawReport(0);

    // Get reports after withdrawal and verify count is one less
    const reportsAfterWithdraw = await reportsPage.getDisplayedReports();
    const finalCount = reportsAfterWithdraw.length;
    expect(finalCount).toBe(initialCount - 1);
  });*/
});
