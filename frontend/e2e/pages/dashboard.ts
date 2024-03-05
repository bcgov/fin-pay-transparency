import { expect, Response } from '@playwright/test';
import { PTPage } from './page';
import { baseURL, PagePaths } from '../utils';

export class DashboardPage extends PTPage {
  static path = PagePaths.DASHBOARD;
  public getReports: Promise<Response>;

  initialize(): void {
    this.getReports = this.instance.waitForResponse(
      '**/api/v1/report/?report_status=Published',
    );
    this.instance.goto(DashboardPage.path);
  }

  async gotoGenerateReport() {
    const generateReportButton = await this.instance.getByText(
      'Generate Pay Transparency Report',
    );
    expect(generateReportButton).toBeVisible();
    await generateReportButton.click();
    await this.instance.waitForURL(`${baseURL}${PagePaths.GENERATE_REPORT}`);
    await expect(this.instance.getByText('Employer Details')).toBeVisible();
  }

  async gotoReport(id: string) {
    const viewReportButton = await this.instance.getByTestId(
      `view-report-${id}`,
    );
    expect(viewReportButton).toBeVisible();
    await viewReportButton.click();
    await this.instance.waitForURL(`${baseURL}${PagePaths.VIEW_REPORT}`);
  }

  async gotoEditReport(id: string) {
    const editReportButton = await this.instance.getByTestId(
      `edit-report-${id}`,
    );
    expect(editReportButton).toBeVisible();
    await editReportButton.click();
    await this.instance.waitForURL(`${baseURL}${PagePaths.GENERATE_REPORT}`);
  }
}
