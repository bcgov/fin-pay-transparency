import { Locator, expect, Page } from '@playwright/test';
import { PTPage } from './page';
import { PagePaths } from '../utils';
import { GenerateReportPage, IReportDetails } from './generate-report';

export class BaseReportPage extends PTPage {
  public downloadPDFButton: Locator;
  public backButton: Locator;

  constructor(
    page: Page,
    public user,
  ) {
    super(page);
  }

  async setup() {
    await super.setup();
    this.downloadPDFButton = await this.instance.getByRole('button', {
      name: 'Download PDF',
    });
    this.backButton = (
      await this.instance.getByRole('link', { name: 'Back' })
    ).first();

    await super.verifyUser(this.user);
  }

  async verifyUser(user) {
    await super.verifyUser(user);
  }

  async verifyEmployeerDetails(user, report) {
    await this.instance.waitForSelector('div.page-content');
    await expect(
      await this.instance.getByRole('cell', { name: 'Employer' }),
    ).toBeVisible();
    await expect(
      await this.instance.getByRole('cell', { name: user.legalName }),
    ).toBeVisible();
    await expect(
      await this.instance.getByRole('cell', { name: 'Address' }),
    ).toBeVisible();
    await expect(
      await this.instance.getByRole('cell', { name: user.addressLine1 }),
    ).toBeVisible();
  }

  async downloadPDF() {
    const downloadPromise = this.instance.waitForEvent('download', (download) =>
      download.suggestedFilename().includes('pay_transparency_report'),
    );
    await this.downloadPDFButton.click();
    await downloadPromise;
  }

  async goBack() {
    await this.backButton.scrollIntoViewIfNeeded();
    await this.backButton.click();
    const confirmTitle = await this.instance.getByText('Please Confirm');
    expect(confirmTitle).toBeVisible();
    const yesButton = await this.instance.getByRole('button', { name: 'Yes' });
    await yesButton.click();
    await this.instance.waitForURL(PagePaths.GENERATE_REPORT);
  }
}

export class DraftReportPage extends BaseReportPage {
  public generateFinalReportButton: Locator;
  public finalReportCheckBox: Locator;

  async setup() {
    await super.setup();
    this.generateFinalReportButton = await this.instance.getByRole('button', {
      name: 'Generate Final Report',
    });
    this.finalReportCheckBox = await this.instance.getByRole('checkbox', {
      name: 'I am ready to create a final report that will be shared with the B.C. Government and can be shared publicly by my employer. Please note, this draft report will not be saved after closing this window or logging out of the system',
    });
  }

  async finalizedReport(reportId: string) {
    const finalizeReportResponse = this.instance.waitForResponse((res) =>
      res.url().includes(`/api/v1/report/${reportId}`),
    );
    const getReportsRequest = this.instance.waitForResponse(
      (res) =>
        res.url().includes('/api/v1/report/?reporting_year=') &&
        res.status() === 200,
    );
    await this.finalReportCheckBox.scrollIntoViewIfNeeded();
    await this.finalReportCheckBox.click();
    await this.generateFinalReportButton.click();
    const getReportsResponse = await getReportsRequest;
    const reports = await getReportsResponse.json();
    if (reports.some((report) => !report.is_unlocked)) {
      await expect(
        await this.instance.getByText(
          'A report for this time period already exists and cannot be updated.',
        ),
      ).toBeVisible();
      return;
    }

    if (reports.length) {
      const confirmTitle = await this.instance.getByText('Please Confirm');
      const yesButton = await this.instance.getByRole('button', {
        name: 'Yes',
      });
      await yesButton.click();
      await expect(confirmTitle).not.toBeVisible();
    }
    const finalize = await finalizeReportResponse;
    const reportData = await finalize.json();
    await this.instance.waitForTimeout(5000);
    await this.instance.waitForURL(PagePaths.VIEW_REPORT);
    return reportData;
  }

  async validateCanGoBack(generateReportPage: GenerateReportPage) {
    await this.backButton.scrollIntoViewIfNeeded();
    await this.goBack();
    await generateReportPage.selectFile('CsvGood.csv');
    await generateReportPage.submitForm();
    await this.instance.waitForURL(PagePaths.DRAFT_REPORT);
  }

  static async initialize(page: Page, user): Promise<DraftReportPage> {
    const draftPage = new DraftReportPage(page, user);
    await draftPage.setup();

    return draftPage;
  }
}

export class PublishedReportPage extends BaseReportPage {
  public editReportButton: Locator;
  public finalReportCheckBox: Locator;

  async setup() {
    await super.setup();
    this.editReportButton = await this.instance.getByRole('button', {
      name: 'Edit this Report',
    });
  }

  async editReport() {
    await this.editReportButton.scrollIntoViewIfNeeded();
    await this.editReportButton.click();
    await this.instance.waitForURL(PagePaths.GENERATE_REPORT);
  }
}
