import { faker } from '@faker-js/faker';
import { DateTimeFormatter, LocalDate } from '@js-joda/core';
import { Locale } from '@js-joda/locale_en';
import path from 'node:path';
import { expect, Locator } from 'playwright/test';
import { AnnouncementStatus } from '../../types';
import { AdminPortalPage } from '../admin-portal-page';
declare const Buffer;

export enum FormMode {
  ADD,
  EDIT,
}

export class FormPage extends AdminPortalPage {
  titleInput: Locator;
  descriptionInput: Locator; //ElementHandle<HTMLElement | SVGElement | null> | null;
  draftOption: Locator;
  publishedOption: Locator;
  cancelButton: Locator;
  saveButton: Locator;
  activeOnInput: Locator;
  expiresOnInput: Locator;
  linkUrlInput: Locator;
  linkTextInput: Locator;
  chooseFileButton: Locator;
  fileDisplayNameInput: Locator;
  fileInput: Locator;

  async setup() {
    await super.setup();
    this.titleInput = await this.page.getByRole('textbox', { name: 'Title' });
    this.descriptionInput = await this.getRichTextElement(
      'announcementDescription',
    );
    this.cancelButton = await this.page.getByRole('button', { name: 'Cancel' });
    this.draftOption = await this.page.getByRole('radio', { name: 'Draft' });
    this.publishedOption = await this.page.getByRole('radio', {
      name: 'Publish',
    });
    this.saveButton = await this.page.getByRole('button', { name: 'Save' });
    this.activeOnInput = await this.page.getByRole('textbox', {
      name: 'Active On',
    });
    this.expiresOnInput = await this.page.getByRole('textbox', {
      name: 'Expires On',
    });
    this.linkUrlInput = await this.page.getByRole('textbox', {
      name: 'Link URL',
    });
    this.linkTextInput = await this.page.getByRole('textbox', {
      name: 'Display URL As',
    });
    this.chooseFileButton = await this.page.getByRole('button', {
      name: 'Choose file',
    });
    this.fileDisplayNameInput = await this.page.getByRole('textbox', {
      name: 'Display File Link As',
    });
    this.fileInput = await this.page.getByLabel('Attachment', { exact: true });

    await expect(this.titleInput).toBeVisible();
    await expect(this.descriptionInput).toBeVisible();
    await expect(this.cancelButton).toBeVisible();
    await expect(this.saveButton).toBeVisible();
    await expect(this.activeOnInput).toBeVisible();
    await expect(this.expiresOnInput).toBeVisible();
  }

  async getRichTextElement(id): Promise<Locator> {
    return await this.page.locator(`#${id} .ql-editor`);
  }

  async selectDraftOption() {
    await expect(this.draftOption).toBeVisible();

    await this.draftOption.click();
  }

  async selectPublishedOption() {
    await expect(this.publishedOption).toBeVisible();

    await this.publishedOption.click();
  }

  async fillTitle(title: string) {
    await this.titleInput.fill(title);
  }

  async fillDescription(description: string) {
    await this.descriptionInput.evaluate(
      (node, desc) => (node.innerHTML = desc),
      description,
    );
  }

  async fillLinkUrl(url: string) {
    await expect(this.linkUrlInput).toBeVisible();
    await this.linkUrlInput.fill(url);
  }

  async fillLinkTextInput(text: string) {
    await expect(this.linkTextInput).toBeVisible();
    await this.linkTextInput.fill(text);
  }

  async clickSaveButton() {
    await this.saveButton.click();
  }

  async clickCancelButton() {
    await this.cancelButton.click();
  }

  async save(status: AnnouncementStatus) {
    if (status === AnnouncementStatus.DRAFT) {
      await this.selectDraftOption();
    } else {
      await this.selectPublishedOption();
    }
    await this.clickSaveButton();
    const saveResponse = this.waitForSave();
    const confirmButton = await this.page.getByRole('button', {
      name: 'Confirm',
    });
    await confirmButton.click();
    const response = await saveResponse;
    const announcement = await response.json();
    await this.page.waitForURL('/announcements');
    return announcement;
  }

  async fillActiveOn(date: LocalDate) {
    const dateCellLabel = date.format(
      DateTimeFormatter.ofPattern('EEEE d MMMM yyyy').withLocale(Locale.CANADA),
    );
    await this.activeOnInput.click();
    const dateCell = await this.page.getByLabel(dateCellLabel);
    await expect(dateCell).toBeVisible();
    await dateCell.click();
  }

  async fillFileDisplayName(displayName: string) {
    await expect(this.fileDisplayNameInput).toBeVisible();
    await this.fileDisplayNameInput.fill(displayName);
  }

  async fillExpiresOn(date: LocalDate) {
    const dateCellLabel = date.format(
      DateTimeFormatter.ofPattern('EEEE d MMMM yyyy').withLocale(Locale.CANADA),
    );
    await this.expiresOnInput.click();
    let dateCell = await this.page.getByLabel(dateCellLabel);

    while (!((await dateCell.all()).length > 0)) {
      const nextButton = await this.page.getByRole('button', {
        name: 'Next month',
      });
      await nextButton.click();
      dateCell = await this.page.getByLabel(dateCellLabel);
    }
    await expect(dateCell.first()).toBeVisible();
    await dateCell.first().click();
  }

  async chooseFile(valid: boolean = true) {
    await this.fillFileDisplayName(faker.lorem.words(1));
    await expect(this.chooseFileButton).toBeVisible();
    const scanResponse = this.waitForClamavScan();

    if (valid) {
      const fileChooserPromise = this.page.waitForEvent('filechooser');

      await this.chooseFileButton.click();
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(
        path.resolve('e2e', 'assets', 'announcements', 'valid.pdf'),
      );
    } else {
      await this.fileInput.setInputFiles({
        name: 'invalid.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from(
          String.raw`X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*`,
        ),
      });
    }

    const response = await scanResponse;
    await response.json();
  }

  async expectFileInvalidError() {
    const error = await this.page.getByText('File is invalid.');
    await expect(error).toBeVisible();
  }

  async verifyPreview() {
    const previewTitle = await this.page.getByText('Preview Announcement');
    await expect(previewTitle).toBeVisible();

    const title = await this.page.getByRole('heading', {
      name: await this.titleInput.inputValue(),
    });
    await expect(title).toBeVisible();
    const descriptionValueInEditor = await this.descriptionInput.innerHTML();
    const descriptionInPreview = await this.page
      .locator('.announcements .rich-text')
      .first()
      .innerHTML();
    await expect(descriptionInPreview).toBe(descriptionValueInEditor);

    const link = await this.page.getByRole('link', {
      name: await this.linkTextInput.inputValue(),
    });
    await expect(link).toBeVisible();

    const fileLink = await this.page.getByText(
      await this.fileDisplayNameInput.inputValue(),
    );
    await expect(fileLink).toBeVisible();
  }

  private waitForSave() {
    const saveResponse = this.page.waitForResponse((res) => {
      return (
        [200, 201].includes(res.status()) &&
        res.url().includes('/admin-api/v1/announcements') &&
        ['POST', 'PUT'].includes(res.request().method())
      );
    });

    return saveResponse;
  }

  private waitForClamavScan() {
    return this.page.waitForResponse((res) => {
      return res.url().includes('/clamav-api');
    });
  }
}
