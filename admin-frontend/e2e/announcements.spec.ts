import { expect, test } from '@playwright/test';
import { AnnouncementsPage } from './pages/announcements/announcements-page';
import { AddAnnouncementPage } from './pages/announcements/add-announcement-page';
import { EditAnnouncementPage } from './pages/announcements/edit-announcement-page';
import { AnnouncementStatus } from './types';

test.describe('Announcements', () => {
  test.describe('add announcement', () => {
    test('save as draft', async ({ page }) => {
      const announcementsPage = new AnnouncementsPage(page);
      await announcementsPage.visit();
      await announcementsPage.validatePage();
      await announcementsPage.clickAddAnnouncementButton();
      const addAnnouncementPage = new AddAnnouncementPage(page);
      await addAnnouncementPage.validatePage();
      await addAnnouncementPage.fillDraftForm();
      const announcement = await addAnnouncementPage.save(
        AnnouncementStatus.DRAFT,
      );
      await expect(announcement.status).toBe(AnnouncementStatus.DRAFT);
      await expect(announcement.title).toBeDefined();
      await expect(announcement.description).toBeDefined();
      await expect(announcement.active_on).toBeNull();
      await expect(announcement.expires_on).toBeNull();
      await announcementsPage.search(announcement.title);
      await announcementsPage.expectTitleVisible(announcement.title);
    });

    test('save as published', async ({ page }) => {
      const announcementsPage = new AnnouncementsPage(page);
      await announcementsPage.visit();
      await announcementsPage.validatePage();
      await announcementsPage.clickAddAnnouncementButton();
      const addAnnouncementPage = new AddAnnouncementPage(page);
      await addAnnouncementPage.validatePage();
      await addAnnouncementPage.fillPublishedForm();
      await addAnnouncementPage.verifyPreview();
      const announcement = await addAnnouncementPage.save(
        AnnouncementStatus.PUBLISHED,
      );
      await expect(announcement.status).toBe(AnnouncementStatus.PUBLISHED);
      await expect(announcement.title).toBeDefined();
      await expect(announcement.description).toBeDefined();
      await expect(announcement.active_on).toBeDefined();
      await expect(announcement.expires_on).toBeDefined();
      await announcementsPage.search(announcement.title);
      await announcementsPage.expectTitleVisible(announcement.title);
    });

    test('save announcement with file attachment', async ({ page }) => {
      const announcementsPage = new AnnouncementsPage(page);
      await announcementsPage.visit();
      await announcementsPage.validatePage();
      await announcementsPage.clickAddAnnouncementButton();
      const addAnnouncementPage = new AddAnnouncementPage(page);
      await addAnnouncementPage.validatePage();

      await addAnnouncementPage.fillDraftForm();
      await addAnnouncementPage.chooseFile(false);
      await addAnnouncementPage.expectFileInvalidError();
      await addAnnouncementPage.chooseFile(true);
      const announcement = await addAnnouncementPage.save(
        AnnouncementStatus.DRAFT,
      );
      await expect(announcement.status).toBe(AnnouncementStatus.DRAFT);
      await expect(announcement.title).toBeDefined();
      await expect(announcement.description).toBeDefined();
      await expect(announcement.active_on).toBeNull();
      await expect(announcement.expires_on).toBeNull();
      await announcementsPage.search(announcement.title);
      await announcementsPage.expectTitleVisible(announcement.title);
    });
  });

  test.describe('edit announcement', () => {
    test('should successfully edit and save announcement', async ({ page }) => {
      const announcementsPage = new AnnouncementsPage(page);
      await announcementsPage.visit();
      await announcementsPage.validatePage();
      await announcementsPage.clickAddAnnouncementButton();
      const addAnnouncementPage = new AddAnnouncementPage(page);
      await addAnnouncementPage.validatePage();
      await addAnnouncementPage.fillPublishedForm();
      const { title } = await addAnnouncementPage.save(
        AnnouncementStatus.PUBLISHED,
      );
      const announcement = await announcementsPage.searchAndEdit(title);
      const editAnnouncementPage = new EditAnnouncementPage(page, announcement);
      await editAnnouncementPage.validatePage();
      await editAnnouncementPage.verifyLoadedData();
      await editAnnouncementPage.editForm();
      const changes = await editAnnouncementPage.saveChanges();
      expect(changes.announcement_id).toBe(announcement.announcement_id);
      await announcementsPage.search(changes.title);
      await announcementsPage.expectTitleVisible(changes.title);
      await announcementsPage.expectDatesVisible(
        changes.active_on,
        changes.expires_on,
      );
      await announcementsPage.expectStatusVisible(changes.status);
    });
  });

  test.describe('archive announcement', () => {
    test('should successfully archive an announcement', async ({ page }) => {
      const announcementsPage = new AnnouncementsPage(page);
      await announcementsPage.visit();
      await announcementsPage.validatePage();
      await announcementsPage.clickAddAnnouncementButton();
      const addAnnouncementPage = new AddAnnouncementPage(page);
      await addAnnouncementPage.validatePage();
      await addAnnouncementPage.fillPublishedForm();
      const { title } = await addAnnouncementPage.save(
        AnnouncementStatus.PUBLISHED,
      );
      await announcementsPage.archiveAnnouncement(title);
    });
  });
  test.describe('unpublish announcement', () => {
    test('should successfully unpublish an announcement', async ({ page }) => {
      const announcementsPage = new AnnouncementsPage(page);
      await announcementsPage.visit();
      await announcementsPage.validatePage();
      await announcementsPage.clickAddAnnouncementButton();
      const addAnnouncementPage = new AddAnnouncementPage(page);
      await addAnnouncementPage.validatePage();
      await addAnnouncementPage.fillPublishedForm();
      const { title } = await addAnnouncementPage.save(
        AnnouncementStatus.PUBLISHED,
      );
      await announcementsPage.unpublishedAnnouncement(title);
    });
  });
});
