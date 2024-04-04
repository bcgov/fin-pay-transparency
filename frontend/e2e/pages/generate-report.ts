import { Locator, expect } from '@playwright/test';
import { PTPage, User } from './page';
import path from 'path';
import flatten from 'lodash/flatten';

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

  async setup() {
    await super.setup();
    await this.instance.waitForLoadState('networkidle');
    this.naicsInput = await this.instance.getByLabel('NAICS Code');
    this.employeeCountInput = await this.instance.locator(
      '#employeeCountRange',
    );
  }

  async setNaicsCode(label: string) {
    await this.naicsInput.click();
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

    const comments = await this.instance.locator('#comments');
    await comments.fill(values.comments);
    const dataConstraints = await this.instance.locator('#dataConstraints');
    await dataConstraints.fill(values.dataConstraints);

    await this.selectFile(values.fileName);
    await this.instance.waitForSelector('i.fa-xmark')
  }

  async submitForm() {
    const button = await this.instance.getByRole('button', { name: 'Submit' });
    await button.scrollIntoViewIfNeeded();
    await button.click();
  }
}
