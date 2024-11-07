import { LocalDate } from '@js-joda/core';
import { Locator, Response, expect } from '@playwright/test';
import path from 'path';
import { PagePaths } from '../utils';
import { validateSubmitErrors, waitForApiResponses } from '../utils/report';
import { PTPage, User } from './page';

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
  public generateDraftButton: Locator;

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

    this.commentsInput = await this.instance.locator(
      '#employerStatement .ql-editor',
    );
    this.dataConstraintsInput = await this.instance.locator(
      '#dataConstraints .ql-editor',
    );

    this.generateDraftButton = await this.instance.getByRole('button', {
      name: 'Generate Draft Report',
    });
  }

  async setNaicsCode(label: string) {
    await this.naicsInput.click();
    await this.instance.waitForTimeout(1000);
    const code = await this.instance.getByRole('option', { name: label });
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
    for (const error of errors.rowErrors) {
      const line = await this.instance.getByTestId(
        `error-on-line-${error.rowNum}`,
      );
      for (const errorMsg of error.errorMsgs) {
        await expect(await line.getByText(errorMsg)).toBeVisible();
      }
    }
    //const rowErrors: string[] = flatten(
    //  errors.rowErrors.map((i) => i.errorMsgs),
    //);
    //for (const errorMsg of rowErrors) {
    //  await expect(await this.instance.getByText(errorMsg)).toBeVisible();
    //}
  }

  async fillOutForm(values: IFormValues) {
    // 2: Fill out the form in the generate report form page
    await this.setNaicsCode(values.naicsCode);
    await this.setEmployeeCount(values.employeeCountRange);

    // set values for the two rich text fields.  these are not standard html text area
    // inputs, and need a special technique to set the value.
    await this.commentsInput.evaluate(
      (node: HTMLElement, html: string) => (node.innerHTML = html),
      values.comments,
    );
    await this.dataConstraintsInput.evaluate(
      (node: HTMLElement, html: string) => (node.innerHTML = html),
      values.dataConstraints,
    );

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
      const userCommentValue = await this.commentsInput.evaluate(
        (node: HTMLElement) => node.innerHTML,
      );
      await expect(userCommentValue).toBe(report.user_comment);
    }

    if (report.data_constraints) {
      const dataConstraintsValue = await this.dataConstraintsInput.evaluate(
        (node: HTMLElement) => node.innerHTML,
      );
      await expect(dataConstraintsValue).toBe(report.data_constraints);
    }
  }

  async checkDate(value: string, monthLocator: Locator, yearLocator: Locator) {
    const date = LocalDate.parse(value);
    await expect(monthLocator).toBeVisible();
    await expect(monthLocator).toHaveValue(`${date.monthValue()}`);
    await expect(yearLocator).toBeVisible();
    await expect(yearLocator).toHaveValue(`${date.year()}`);
  }

  async submitForm(responseChecker?: (res: Response) => boolean) {
    await this.generateDraftButton.scrollIntoViewIfNeeded();
    if (responseChecker) {
      const { report } = await waitForApiResponses(
        {
          report: this.instance.waitForResponse(responseChecker),
        },
        async () => {
          await this.generateDraftButton.click();
        },
      );
      return report;
    } else {
      await this.generateDraftButton.click();
    }
  }

  async submitInvalidFormAndValidateErrors() {
    await this.submitForm();
    // Check form errors
    await this.checkErrors();
    // Check API errors
    await validateSubmitErrors(this);
  }

  async submitValidFormAndGotoDraftPage() {
    await this.naicsInput.scrollIntoViewIfNeeded();
    await this.fillOutForm({
      naicsCode: '11 - Agriculture, forestry, fishing and hunting',
      employeeCountRange: '50-299',
      comments: 'Example test comment',
      dataConstraints: 'Example data constraint text',
      fileName: 'CsvGood.csv',
    });

    const validUploadResponse = await this.submitForm(
      (res) =>
        res.url().includes('/api/v1/file-upload') && res.status() === 200,
    );

    await this.instance.waitForURL(PagePaths.DRAFT_REPORT);

    return validUploadResponse;
  }

  async editReportAndSubmit(reportDetails: IReportDetails) {
    // edit form and submit form
    const naicsCode = PTPage.naicsCodes.find(
      (n) => n.naics_code !== reportDetails.naics_code,
    );
    await this.naicsInput.click();
    await this.setNaicsCode(
      `${naicsCode!.naics_code} - ${naicsCode!.naics_label}`,
    );
    const employeeCountRange = PTPage.employeeCountRanges.find(
      (n) =>
        n.employee_count_range_id !== reportDetails.employee_count_range_id,
    );

    await this.setEmployeeCount(employeeCountRange!.employee_count_range);
    const comment = 'new comment edit';
    await this.commentsInput.fill(comment);
    const dataConstraint = 'new data constraint edit';
    await this.dataConstraintsInput.fill(dataConstraint);

    await this.selectFile('CsvGood.csv');
    return this.submitForm(
      (res) =>
        res.url().includes('/api/v1/file-upload') && res.status() === 200,
    );
  }
}
