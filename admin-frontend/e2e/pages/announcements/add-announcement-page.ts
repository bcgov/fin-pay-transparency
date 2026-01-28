import { LocalDate } from '@js-joda/core';
import { PagePaths } from '../../utils';
import { FormPage } from './form-page';
import { faker } from '@faker-js/faker';
import { AnnouncementStatus } from '../../types';

export class AddAnnouncementPage extends FormPage {
  constructor(page) {
    super(page);
  }

  async visit() {
    await this.page.goto(PagePaths.ADD_ANNOUNCEMENTS);
  }

  async saveAnnouncementAsDraft() {
    await this.save(AnnouncementStatus.DRAFT);
    await this.page.waitForURL(PagePaths.ANNOUNCEMENTS);
  }

  async fillDraftForm() {
    await this.fillTitle(faker.lorem.words(3));
    await this.fillDescription(faker.lorem.words(10));
  }

  async fillPublishedForm() {
    await this.fillTitle(faker.lorem.words(3));
    await this.fillDescription(faker.lorem.words(10));
    const activeOn = LocalDate.now();
    const expiresOn = LocalDate.now().plusDays(1);
    await this.fillActiveOn(activeOn);
    await this.fillExpiresOn(expiresOn);
    await this.fillLinkUrl(faker.internet.url());
    await this.fillLinkTextInput(faker.lorem.words(3));
    await this.chooseFile(true);
  }
}
