import { Locator, expect } from '@playwright/test';
import { PTPage } from './page';
import { PagePaths, baseURL } from '../utils';
import { DateTimeFormatter, LocalDate } from '@js-joda/core';
import { Locale } from '@js-joda/locale';
import path from 'path';

interface IFormValues {
  naicsCode: string;
  employeeCountRange: string;
  comments: string;
  dataConstraints: string;
  fileName: string;
}

export class GenerateReportPage extends PTPage {
  public naicsInput: Locator;
  public employeeCountInput: Locator;

  async setup() {
    this.naicsInput = await this.instance.locator('#naicsCode');
    this.employeeCountInput = await this.instance.locator(
      '#employeeCountRange',
    );
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

  async fillOutForm(values: IFormValues) {
    // 2: Fill out the form in the generate report form page
    await this.setup();
    await this.setNaicsCode(values.naicsCode);
    await this.setEmployeeCount(values.employeeCountRange);
    await this.instance.waitForTimeout(250);
    const formatter = DateTimeFormatter.ofPattern('MMMM YYYY').withLocale(
      Locale.CANADA,
    );
    await this.instance
      .getByText('Contextual Info/Comments')
      .scrollIntoViewIfNeeded();
    const startDate = LocalDate.now().minusYears(1).withDayOfMonth(1);
    const start = this.instance.getByText(startDate.format(formatter));

    await this.instance.mouse.up({ clickCount: 4 });
    await expect(start).toBeDefined();

    const endDate = LocalDate.now().minusMonths(1).withDayOfMonth(1);
    const end = this.instance.getByText(endDate.format(formatter));
    await expect(end).toBeDefined();

    const comments = await this.instance.locator('#comments');
    await comments.fill(values.comments);

    await this.instance.getByText('File Upload').scrollIntoViewIfNeeded();

    const dataConstraints = await this.instance.locator('#dataConstraints');
    await dataConstraints.fill('Example data constraint text');

    const fileChooserPromise = this.instance.waitForEvent('filechooser');
    const csvFileInput = await this.instance.locator('#csvFile');
    await csvFileInput.click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(path.join(__dirname, 'assets', values.fileName));
    await this.instance.waitForTimeout(1000);
  }

  async submitForm() {
    const button = await this.instance.locator('#submitButton');
    await button.scrollIntoViewIfNeeded();
    await button.click();
  }
}
