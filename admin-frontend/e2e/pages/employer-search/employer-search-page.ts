import { expect, Locator } from 'playwright/test';
import { AdminPortalPage } from '../admin-portal-page';

export class EmployerSearchPage extends AdminPortalPage {
  searchInput: Locator;
  calendarYearInput: Locator;
  searchButton: Locator;
  resetButton: Locator;

  async setup(): Promise<void> {
    this.searchInput = await this.page.getByLabel('Search by employer name');
    this.calendarYearInput = await this.page.getByLabel('Calendar Year(s)');
    this.searchButton = await this.page.getByRole('button', {
      name: 'Search',
    });
    this.resetButton = await this.page.getByRole('button', {
      name: 'Reset',
    });

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
      const count = employers.filter((e) => e.company_name === employer.company_name).length;
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
