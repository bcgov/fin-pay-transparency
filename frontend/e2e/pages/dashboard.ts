import { expect } from '@playwright/test';
import { PTPage, User } from './page';
import { PagePaths } from '../utils';

export class DashboardPage extends PTPage {
  static path = PagePaths.DASHBOARD;
  public generateReportButton;

  async setup() {
    await super.setup();
    this.generateReportButton = await this.instance.getByRole('link', {
      name: /Upload your CSV here/i,
    });
  }

  async gotoGenerateReport() {
    expect(this.generateReportButton).toBeVisible();
    await this.generateReportButton.click();
    await this.instance.waitForURL(PagePaths.GENERATE_REPORT);
    await expect(
      this.instance.getByText(
        'Disclaimer: This tool relies on the employer supplying accurate and complete payroll data in order to calculate pay gaps.',
      ),
    ).toBeVisible();
  }

  async gotoReport(id: string) {
    const viewReportButton = await this.instance.getByTestId(
      `view-report-${id}`,
    );
    expect(viewReportButton).toBeVisible();
    await viewReportButton.click();
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

  async gotoEditReport(id: string) {
    const editReportButton = await this.instance.getByTestId(
      `edit-report-${id}`,
    );
    expect(editReportButton).toBeVisible();
    await editReportButton.click();
    await this.instance.waitForURL(PagePaths.GENERATE_REPORT);
  }

  async verifyUser(user: User): Promise<void> {
    const welcome = await this.instance.getByRole('heading', {
      name: `Welcome, ${user.legalName}`,
    });
    await expect(welcome).toBeVisible();
    await super.verifyUser(user);
  }
}
