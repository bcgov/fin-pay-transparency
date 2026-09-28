import { Locator, Page, expect } from '@playwright/test';
import { PTPage, User } from './page';
import { PagePaths } from '../utils';
import {
  IEmployeeCountRange,
  INaicsCode,
  IReportDetails,
} from './generate-report';
import { waitForCodes } from '../utils/report';

export class DashboardPage extends PTPage {
  static path = PagePaths.DASHBOARD;
  public generateReportButton;

  async setup() {
    await super.setup();
    this.generateReportButton = await this.instance.getByRole('link', {
      name: /Upload your CSV here/i,
    });
    await expect(this.generateReportButton).toBeVisible();
  }

  async gotoGenerateReport() {
    await waitForCodes(this.instance, async () => {
      await expect(this.generateReportButton).toBeVisible();
      await this.generateReportButton.click();
      await this.instance.waitForURL(PagePaths.GENERATE_REPORT);
      await expect(
        this.instance.getByText(
          'Disclaimer: This tool relies on the employer supplying accurate and complete payroll data in order to calculate pay gaps.',
        ),
      ).toBeVisible();
    });
  }

  async gotoReport(id: string) {
    const viewReportButton = await this.instance.getByTestId(
      `view-report-${id}`,
    );
    expect(viewReportButton).toBeVisible();
    await viewReportButton.click();
    await this.instance.waitForURL(PagePaths.VIEW_REPORT);
  }

  async gotoFirstReport() {
    // Find all view-report buttons and click the first one
    const viewReportButtons = await this.instance.getByTestId(/view-report-.*/);
    const firstButton = viewReportButtons.first();
    await expect(firstButton).toBeVisible();
    await firstButton.click();
    await this.instance.waitForURL(PagePaths.VIEW_REPORT);
  }

  async checkReport(id: string) {
    const viewReportButton = await this.instance.getByTestId(
      `view-report-${id}`,
    );
    await expect(viewReportButton).toBeVisible();
  }

  async canEditReport(id: string) {
    const editReportButton = await this.instance.getByTestId(
      `edit-report-${id}`,
    );
    await expect(editReportButton).toBeVisible();

    return editReportButton;
  }

  async addOrUpdateReportUrl(reportId: string, url: string) {
    const row = this.instance
      .locator('tr')
      .filter({ has: this.instance.getByTestId(`reporting_year-${reportId}`) })
      .first();
    await expect(row).toBeVisible();

    const addLinkButton = row.getByRole('button', {
      name: '+Add Link',
    });
    const editLinkButton = row.getByRole('button', { name: /Edit Link/i });

    const trigger = (await addLinkButton.count())
      ? addLinkButton.first()
      : editLinkButton.first();

    await expect(trigger).toBeVisible();
    await trigger.click();

    const urlInput = row.getByLabel('Report URL').first();
    await expect(urlInput).toBeVisible();
    await urlInput.fill(url);

    const saveButton = row.getByRole('button', { name: 'Save' }).first();
    const saveResponse = this.instance.waitForResponse(
      (res) =>
        res.url().includes('/api/v1/report-url/') &&
        res.request().method() === 'POST',
    );
    await saveButton.click();
    await saveResponse;
    await expect(row.getByRole('link', { name: url })).toBeVisible();
  }

  async removeReportUrl(reportId: string) {
    const row = this.instance
      .locator('tr')
      .filter({ has: this.instance.getByTestId(`reporting_year-${reportId}`) })
      .first();
    const existingLink = row.getByRole('link').first();
    await expect(existingLink).toBeVisible();
    const editLinkButton = row
      .getByRole('button', { name: /Edit Link/i })
      .first();
    await editLinkButton.click();

    const urlInput = row.getByLabel('Report URL').first();
    await expect(urlInput).toBeVisible();
    await urlInput.fill('');

    const saveButton = row.getByRole('button', { name: 'Save' }).first();
    const confirmDialog = this.instance.getByRole('button', {
      name: 'Remove Link',
    });
    const saveResponse = this.instance.waitForResponse(
      (res) =>
        res.url().includes('/api/v1/report-url/') &&
        res.request().method() === 'POST',
    );

    await saveButton.click();
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.click();
    await saveResponse;
    await expect(
      row.getByRole('button', {
        name: /\+Add link to published report|\+Add Link/i,
      }),
    ).toBeVisible();
  }

  async manageReportUrlSequence(
    reportId: string,
    firstUrl: string,
    secondUrl: string,
  ) {
    await this.addOrUpdateReportUrl(reportId, firstUrl);
    await this.removeReportUrl(reportId);
    await this.addOrUpdateReportUrl(reportId, secondUrl);
  }

  async gotoEditReport(reportId: string, button: Locator) {
    const getReportDetailsRequest = this.instance.waitForResponse(
      (res) =>
        res.url().includes(`/api/v1/report/${reportId}`) &&
        res.status() === 200,
    );
    const getEmployeeCountRangesRequest = this.instance.waitForResponse(
      (res) =>
        res.url().includes('/api/v1/codes/employee-count-ranges') &&
        res.status() === 200,
    );
    const getNaicsCodesRequest = this.instance.waitForResponse(
      (res) =>
        res.url().includes('/api/v1/codes/naics-codes') && res.status() === 200,
    );

    expect(button).toBeVisible();
    await button.click();
    await this.instance.waitForURL(PagePaths.GENERATE_REPORT);
    const getReportDetailsResponse = await getReportDetailsRequest;
    const reportDetails: IReportDetails = await getReportDetailsResponse.json();
    const getEmployeeCountRangesResponse = await getEmployeeCountRangesRequest;
    const employeeCountRanges: IEmployeeCountRange[] =
      await getEmployeeCountRangesResponse.json();
    const getNaicsCodesResponse = await getNaicsCodesRequest;
    const naicsCodes: INaicsCode[] = await getNaicsCodesResponse.json();

    PTPage.employeeCountRanges = employeeCountRanges;
    PTPage.naicsCodes = naicsCodes;

    return { reportDetails, naicsCodes, employeeCountRanges };
  }

  async verifyUser(user: User): Promise<void> {
    const welcome = await this.instance.getByRole('heading', {
      name: `Welcome, ${user.legalName}`,
    });
    await expect(welcome).toBeVisible();
    await super.verifyUser(user);
  }

  /**
   * Stabilizes dynamic content for visual regression testing by hiding and replacing
   * variable date/year elements with consistent values
   */
  async stabilizeForVisualTesting(year: string, date: string): Promise<void> {
    const viewReportButtons = await this.instance.getByTestId(/view-report-.*/);
    await viewReportButtons.waitFor();

    await this.instance.addStyleTag({
      content: `
        /* Hide dynamic elements that change frequently */
        [data-testid*="timestamp"],
        [data-testid*="report_published_date"],
        [data-testid*="reporting_year"],
        .dynamic-content {
          visibility: hidden !important;
        }
      `,
    });

    // Replace dynamic content with consistent values using JavaScript
    await this.instance.evaluate(
      ({ year, date }) => {
        // Replace all reporting year elements
        const yearElements = document.querySelectorAll(
          '[data-testid*="reporting_year-"]',
        );
        yearElements.forEach((el) => {
          if (el instanceof HTMLElement) {
            el.textContent = year;
            el.style.visibility = 'visible';
          }
        });

        // Replace all published date elements
        const dateElements = document.querySelectorAll(
          '[data-testid*="report_published_date-"]',
        );
        dateElements.forEach((el) => {
          if (el instanceof HTMLElement) {
            el.textContent = date;
            el.style.visibility = 'visible';
          }
        });
      },
      { year, date },
    );
  }

  static async visit(page: Page): Promise<DashboardPage> {
    await page.goto(PagePaths.DASHBOARD);
    const dashboard = new DashboardPage(page);
    await dashboard.setup();
    return dashboard;
  }
}
