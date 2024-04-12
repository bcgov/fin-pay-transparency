import { Locator, expect } from '@playwright/test';
import { PTPage, User } from './page';
import path from 'path';
import flatten from 'lodash/flatten';
import { LocalDate } from '@js-joda/core';

export interface IReportDetails {
  report_id: string;
  user_comment: string;
  employee_count_range_id: string;
  naics_code: string;
  report_start_date: string;
  report_end_date: string;
  reporting_year: string;
  report_status: string;
  revision: string;
  data_constraints: string;
  is_unlocked: boolean;
  create_date: string;
  company_id: string;
}

export interface INaicsCode {
  naics_code: string;
  naics_label: string;
}

export interface IEmployeeCountRange {
  employee_count_range_id: string;
  employee_count_range: string;
}

interface IFormValues {
  naicsCode: string;
  employeeCountRange: string;
  comments: string;
  dataConstraints: string;
  fileName: string;
}

interface IUploadFileErrors {
  bodyErrors: string[] | undefined;
  generalErrors: string[] | undefined;
  rowErrors: { errorMsgs: string[]; rowNum: number }[];
}

export class GenerateReportPage extends PTPage {
  public naicsInput: Locator;
  public employeeCountInput: Locator;
  public reportingYearInput: Locator;
  public startMonthInput: Locator;
  public startYearInput: Locator;
  public endMonthInput: Locator;
  public endYearInput: Locator;
  public commentsInput: Locator;
  public dataConstraintsInput: Locator;

  async setup() {
    await super.setup();
    await this.instance.waitForLoadState('networkidle');
    this.naicsInput = await this.instance.getByLabel('NAICS Code');
    this.employeeCountInput = await this.instance.locator(
      '#employeeCountRange',
    );
    this.reportingYearInput = await this.instance.locator('#reportYear');
    this.startMonthInput = await this.instance.locator('#startMonth');
    this.startYearInput = await this.instance.locator('#startYear');
    this.endMonthInput = await this.instance.locator('#endMonth');
    this.endYearInput = await this.instance.locator('#endYear');

    this.commentsInput = await this.instance.locator('#comments');
    this.dataConstraintsInput = await this.instance.locator('#dataConstraints');
  }

  async  setNaicsCode(label: string) {
    await this.naicsInput.click();
    await this.instance.waitForTimeout(1000);
    const code = await this.instance.getByText(label);
    expect(code).toBeVisible();
    await code.click();
  }

  async setEmployeeCount(label: string) {
    const option = await this.instance.getByLabel(label);
    expect(option).toBeVisible();
    await option.click();
  }

  async verifyUser(user: User): Promise<void> {
    await super.verifyUser(user);
    await expect(await this.instance.locator('#companyName')).toHaveText(
      user.legalName,
    );
    await expect(
      await this.instance.getByText(user.addressLine1),
    ).toBeVisible();
  }

  async selectFile(fileName: string) {
    const fileChooserPromise = this.instance.waitForEvent('filechooser');
    const csvFileInput = await this.instance.locator('#uploadFileButton');
    await csvFileInput.click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(path.resolve('e2e', 'assets', fileName));
  }

  async checkErrors() {
    await expect(
      await this.instance.getByText(
        'Please check the form and correct all errors before submitting.',
      ),
    ).toBeVisible();
  }

  async validateUploadRowValues(errors: IUploadFileErrors) {
    await expect(
      await this.instance.getByText(
        'The submission contains errors which must be corrected. Please review the following lines from the uploaded file:',
      ),
    ).toBeVisible();
    const rowErrors: string[] = flatten(
      errors.rowErrors.map((i) => i.errorMsgs),
    );
    for (const errorMsg of rowErrors) {
      await expect(await this.instance.getByText(errorMsg)).toBeVisible();
    }
  }

  async fillOutForm(values: IFormValues) {
    // 2: Fill out the form in the generate report form page
    await this.setup();
    await this.setNaicsCode(values.naicsCode);
    await this.setEmployeeCount(values.employeeCountRange);

    await this.commentsInput.fill(values.comments);
    await this.dataConstraintsInput.fill(values.dataConstraints);

    await this.selectFile(values.fileName);
    await this.instance.waitForSelector('i.fa-xmark');
  }

  async checkDefaultFormValues(report: IReportDetails) {
    const naicsCode = PTPage.naicsCodes.find(
      (nc) => nc.naics_code === report.naics_code,
    );
    const employeeCountRange = PTPage.employeeCountRanges.find(
      (nc) => nc.employee_count_range_id === report.employee_count_range_id,
    );
    await expect(
      await this.instance.getByText(
        `${naicsCode?.naics_code} - ${naicsCode?.naics_label}`,
      ),
    ).toBeVisible();

    const radioButton = await this.instance.getByLabel(
      employeeCountRange!.employee_count_range,
    );
    await expect(await radioButton.isChecked()).toBeTruthy();

    await expect(this.reportingYearInput).toBeVisible();
    await expect(this.reportingYearInput).toHaveValue(report.reporting_year);
    await expect(this.reportingYearInput).toBeDisabled();

    await this.checkDate(
      report.report_start_date,
      this.startMonthInput,
      this.startYearInput,
    );
    await this.checkDate(
      report.report_end_date,
      this.endMonthInput,
      this.endYearInput,
    );
    if (report.user_comment) {
      await expect(this.commentsInput).toHaveValue(report.user_comment);
    } else {
      await expect(this.commentsInput).toBeEmpty();
    }

    if(report.data_constraints) {
      await expect(this.dataConstraintsInput).toHaveValue(
        report.data_constraints,
      );
    } else {
      await expect(this.dataConstraintsInput).toBeEmpty();
    }
  }

  async checkDate(value: string, monthLocator: Locator, yearLocator: Locator) {
    const date = LocalDate.parse(value);
    await expect(monthLocator).toBeVisible();
    await expect(monthLocator).toHaveValue(`${date.monthValue()}`);
    await expect(yearLocator).toBeVisible();
    await expect(yearLocator).toHaveValue(`${date.year()}`);
  }

  async submitForm() {
    const button = await this.instance.getByRole('button', { name: 'Submit' });
    await button.scrollIntoViewIfNeeded();
    await button.click();
  }
}
