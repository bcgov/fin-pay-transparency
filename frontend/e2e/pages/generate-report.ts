import { Locator, expect } from '@playwright/test';
import { PTPage } from './page';
import { PagePaths, baseURL } from '../utils';

export class GenerateReportPage extends PTPage {
  public naicsInput: Locator;
  public employeeCountInput: Locator;

  async setup() {
    this.naicsInput = await this.instance.locator('#naicsCode');
    this.employeeCountInput = await this.instance.locator('#employeeCountRange');
  }

  async setNaicsCode(label: string) {
    await this.naicsInput.click();
    const code = await this.instance.getByText(label);
    expect(code).toBeVisible();
    await code.click();
  }

  async setEmployeeCount(label: string) {
    await this.employeeCountInput.press('Enter');
    const option = await this.instance.getByText(label);
    expect(option).toBeVisible();
    await option.click();
  }

  async submitForm() {
    const button = await this.instance.locator('#submitButton');
    await button.scrollIntoViewIfNeeded();
    await button.click();
    await this.instance.waitForURL(`${baseURL}${PagePaths.DRAFT_REPORT}`)
  }
}
