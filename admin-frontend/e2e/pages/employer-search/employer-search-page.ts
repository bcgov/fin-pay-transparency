import { expect, Locator } from 'playwright/test';
import { AdminPortalPage } from '../admin-portal-page';
import { PagePaths } from '../../utils';

export class EmployerSearchPage extends AdminPortalPage {
  searchInput: Locator;
  calendarYearInput: Locator;
  searchButton: Locator;
  resetButton: Locator;

  constructor(page) {
    super(page);
    this.searchInput = page.getByLabel('Search by employer name');
    this.calendarYearInput = page.getByLabel('Calendar Year(s)');
    this.searchButton = page.getByRole('button', { name: 'Search' });
    this.resetButton = page.getByRole('button', { name: 'Reset' });
  }

  async visit() {
    await this.page.goto(PagePaths.EMPLOYERS);
  }

  async validatePage(): Promise<void> {
    await expect(this.searchInput).toBeVisible();
    await expect(this.calendarYearInput).toBeVisible();
    await expect(this.searchButton).toBeVisible();
    await expect(this.resetButton).toBeVisible();
  }

  async searchEmployerByAndVerify(): Promise<void> {
    await this.searchInput.fill('');
    const waitForResults = this.waitForResultsToLoad();
    await this.searchButton.click();
    const response = await waitForResults;
    const { employers } = await response.json();
    const table = await this.page.getByRole('table');
    await expect(table).toBeVisible();

    for (const employer of employers) {
      const employerName = await this.page.getByText(employer.company_name);
      const count = employers.filter(
        (e) => e.company_name === employer.company_name,
      ).length;
      await expect(await employerName.count()).toBe(count);
    }
  }

  private waitForResultsToLoad() {
    return this.page.waitForResponse(
      (response) =>
        response.url().includes('admin-api/v1/employers') &&
        response.status() === 200 &&
        response.request().method() === 'GET',
    );
  }
}
