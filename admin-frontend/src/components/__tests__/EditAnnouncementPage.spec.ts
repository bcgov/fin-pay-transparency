import { faker } from '@faker-js/faker';
import { convert, LocalDate } from '@js-joda/core';
import { fireEvent, render, waitFor } from '@testing-library/vue';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { useAnnouncementSelectionStore } from '../../store/modules/announcementSelectionStore';
import { AnnouncementResourceType } from '../../types/announcements';
import EditAnnouncementPage from '../EditAnnouncementPage.vue';

global.ResizeObserver = require('resize-observer-polyfill');

const mockRouterReplace = vi.fn();
vi.mock('vue-router', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    useRouter: () => ({
      replace: mockRouterReplace,
      push: vi.fn(),
    }),
  };
});

const vuetify = createVuetify({
  components,
  directives,
});

const pinia = createPinia();

const wrappedRender = () => {
  return render(EditAnnouncementPage, {
    global: {
      plugins: [vuetify, pinia],
    },
  });
};

const mockUpdateAnnouncement = vi.fn();
const mockDownloadFile = vi.fn();
const mockGetAnnouncement = vi.fn();
vi.mock('../../services/apiService', () => ({
  default: {
    updateAnnouncement: (...args) => mockUpdateAnnouncement(...args),
    getAnnouncements: (...args) => mockGetAnnouncement(...args),
    downloadFile: (...args) => mockDownloadFile(...args),
  },
}));

const mockSuccess = vi.fn();
const mockError = vi.fn();
vi.mock('../../services/notificationService', () => ({
  NotificationService: {
    pushNotificationSuccess: () => mockSuccess(),
    pushNotificationError: () => mockError(),
  },
}));

let store: ReturnType<typeof useAnnouncementSelectionStore>;
describe('EditAnnouncementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(pinia);
    store = useAnnouncementSelectionStore();
    store.reset();
  });
  describe('when announcement is not found', () => {
    it('should go back to announcement list', async () => {
      await wrappedRender();
      expect(mockRouterReplace).toHaveBeenCalled();
    });
  });
  describe('when announcement is found', () => {
    describe('when announcement is published', () => {
      it('should not display DRAFT radio button', async () => {
        store.setAnnouncement({
          title: 'title',
          description: 'description',
          status: 'PUBLISHED',
          announcement_resource: [],
        } as any);
        const { queryByLabelText } = await wrappedRender();
        expect(queryByLabelText('Draft')).toBeNull();
      });
    });
    describe('when announcement was previously published and no expiry date', () => {
      it('No expiry should be checked', async () => {
        store.setAnnouncement({
          title: 'title',
          description: 'description',
          status: 'PUBLISHED',
          announcement_resource: [],
        } as any);
        const { getByRole } = await wrappedRender();
        const noExpiry = getByRole('checkbox', { name: 'No expiry' });
        expect(noExpiry).toBeChecked();
      });
    });
    describe('when announcement is draft', () => {
      it('should display DRAFT and PUBLISH radio buttons', async () => {
        store.setAnnouncement({
          title: 'title',
          description: 'description',
          status: 'DRAFT',
          announcement_resource: [],
        } as any);
        const { getByLabelText } = await wrappedRender();
        expect(getByLabelText('Draft')).toBeInTheDocument();
        expect(getByLabelText('Publish')).toBeInTheDocument();
      });

      describe('when publishing announcement', () => {
        describe('when expires on is before active on', () => {
          it('should show error message', async () => {
            const publishDate = LocalDate.now().plusDays(4);
            store.setAnnouncement({
              title: 'title',
              description: 'description',
              active_on: convert(publishDate).toDate(),
              expires_on: convert(publishDate.minusDays(1)).toDate(),
              status: 'DRAFT',
              announcement_resource: [],
            } as any);
            const { getByRole, getByText } = await wrappedRender();
            const saveButton = getByRole('button', { name: 'Save' });
            await fireEvent.click(saveButton);
            // await fireEvent.click(publishButton);
            await waitFor(() => {
              expect(
                getByText('Publish On date should be before expiry date.'),
              ).toBeVisible();
            });
          });
        });
        describe('when active on date is not set', () => {
          it('should show error message', async () => {
            store.setAnnouncement({
              title: 'title',
              description: 'description',
              status: 'PUBLISHED',
              announcement_resource: [],
            } as any);
            const { getByRole, getByText } = await wrappedRender();
            const saveButton = getByRole('button', { name: 'Save' });
            await fireEvent.click(saveButton);
            await waitFor(() => {
              expect(getByText('Active On date is required.')).toBeVisible();
            });
          });
        });
        it('should require Active On date to be not in the past', async () => {
          store.setAnnouncement({
            title: 'title',
            description: 'description',
            active_on: faker.date.past(),
            status: 'DRAFT',
            announcement_resource: [],
          } as any);
          const { getByRole, getByText, getByLabelText } =
            await wrappedRender();
          const publishButton = getByLabelText('Publish');
          expect(publishButton).toBeInTheDocument();
          await fireEvent.click(publishButton);
          const saveButton = getByRole('button', { name: 'Save' });
          await fireEvent.click(saveButton);
          await waitFor(() => {
            expect(
              getByText(
                'Active On date cannot be in the past. Please select a new date.',
              ),
            ).toBeInTheDocument();
          });
        });
      });
    });

    describe('when expires_on is in the past', () => {
      it('should show error message', async () => {
        const mockAnnouncement = {
          announcement_id: '1',
          title: 'title',
          description: '<p>description</p>',
          active_on: new Date(),
          expires_on: convert(LocalDate.now().minusDays(1)).toDate(),
          status: 'PUBLISHED',
          announcement_resource: [
            {
              resource_type: 'LINK',
              display_name: 'link',
              resource_url: 'https://example.com',
            },
          ],
        } as any;
        store.setAnnouncement(mockAnnouncement);
        const { getByText, getByLabelText, getByRole, container } =
          await wrappedRender();
        expect(getByLabelText('Publish')).toBeChecked();
        expect(getByLabelText('Title')).toHaveValue('title');
        const anouncementDescription = container.querySelector(
          '#announcementDescription .ql-editor',
        )?.innerHTML;
        expect(anouncementDescription).toBe(mockAnnouncement.description);
        const saveButton = getByRole('button', { name: 'Save' });
        await fireEvent.click(saveButton);
        await waitFor(() => {
          expect(
            getByText(
              'Expires On date cannot be in the past. Please choose another date.',
            ),
          ).toBeVisible();
        });
      });
    });

    describe('when announcement is updated', () => {
      it('should show success notification', async () => {
        const mockAnnouncement = {
          announcement_id: '1',
          title: 'title',
          description: '<p>description</p>',
          active_on: new Date(),
          status: 'PUBLISHED',
          announcement_resource: [
            {
              resource_type: 'LINK',
              display_name: 'link',
              resource_url: 'https://example.com',
            },
          ],
        } as any;
        store.setAnnouncement(mockAnnouncement);
        const { queryByRole, getByRole, getByLabelText, container } =
          await wrappedRender();
        expect(getByLabelText('Publish')).toBeChecked();
        expect(getByLabelText('Title')).toHaveValue('title');
        const anouncementDescription = container.querySelector(
          '#announcementDescription .ql-editor',
        )?.innerHTML;
        expect(anouncementDescription).toBe(mockAnnouncement.description);

        const saveButton = getByRole('button', { name: 'Save' });
        await fireEvent.click(saveButton);
        await waitFor(async () => {
          const confirmButton = getByRole('button', { name: 'Confirm' });
          await fireEvent.click(confirmButton);
        });
        await waitFor(() => {
          const confirmButton = queryByRole('button', { name: 'Confirm' });
          expect(confirmButton).toBeNull();
        });
        await waitFor(() => {
          expect(mockUpdateAnnouncement).toHaveBeenCalled();
          expect(mockSuccess).toHaveBeenCalled();
        });
      });
    });

    describe('when announcement has an attachment', () => {
      it('should display attachment', async () => {
        store.setAnnouncement({
          announcement_id: '1',
          title: 'title',
          description: 'description',
          active_on: new Date(),
          status: 'PUBLISHED',
          announcement_resource: [
            {
              announcement_resource_id: '1',
              resource_type: 'ATTACHMENT',
              display_name: 'file name',
              attachment_file_id: '1',
            },
          ],
        } as any);
        const { getByRole, getByText } = await wrappedRender();
        expect(getByText('file name')).toBeInTheDocument();
        expect(getByRole('button', { name: 'Edit file' })).toBeInTheDocument();
        expect(
          getByRole('button', { name: 'Delete file' }),
        ).toBeInTheDocument();
      });

      describe('when attachment is deleted', () => {
        it('should remove attachment', async () => {
          store.setAnnouncement({
            announcement_id: '1',
            title: 'title',
            description: 'description',
            active_on: new Date(),
            expires_on: convert(LocalDate.now().plusDays(1)).toDate(),
            status: 'PUBLISHED',
            announcement_resource: [
              {
                announcement_resource_id: '1',
                resource_type: 'ATTACHMENT',
                display_name: 'file name',
                attachment_file_id: '1',
              },
            ],
          } as any);
          const { getByRole, getByLabelText } = await wrappedRender();
          const deleteButton = getByRole('button', { name: 'Delete file' });
          await fireEvent.click(deleteButton);
          const fileNameInput = getByLabelText('Display File Link As');
          await waitFor(() => {
            expect(fileNameInput).toHaveValue('');
          });
          const saveButton = getByRole('button', { name: 'Save' });
          await fireEvent.click(saveButton);
          await waitFor(async () => {
            const confirmButton = getByRole('button', { name: 'Confirm' });
            await fireEvent.click(confirmButton);
          });
          await waitFor(() => {
            const args = mockUpdateAnnouncement.mock.calls[0];
            const data = args[1];
            expect(data.fileDisplayName).toBeUndefined();
            expect(data.attachment).toBeUndefined();
            expect(data.attachmentId).toBeUndefined();
          });
        });
      });

      describe('when attachment edit is clicked', () => {
        it('should update attachment', async () => {
          store.setAnnouncement({
            announcement_id: '1',
            title: 'title',
            description: 'description',
            active_on: new Date(),
            status: 'PUBLISHED',
            announcement_resource: [
              {
                announcement_resource_id: '1',
                resource_type: 'ATTACHMENT',
                display_name: 'file name',
                attachment_file_id: '1',
              },
            ],
          } as any);
          const { getByRole, getByLabelText } = await wrappedRender();
          const editButton = getByRole('button', { name: 'Edit file' });
          await fireEvent.click(editButton);
          const fileNameInput = getByLabelText('Display File Link As');
          await waitFor(() => {
            expect(fileNameInput).toHaveValue('file name');
          });
          const cancelEditButton = getByRole('button', {
            name: 'Edit file',
          });
          await fireEvent.click(cancelEditButton);
          const deleteButton = getByRole('button', { name: 'Delete file' });
          await waitFor(() => {
            expect(deleteButton).toBeInTheDocument();
          });
        });
      });

      describe('when link is clicked', () => {
        it('should download file', async () => {
          store.setAnnouncement({
            announcement_id: '1',
            title: 'title',
            description: 'description',
            active_on: new Date(),
            status: 'PUBLISHED',
            announcement_resource: [
              {
                announcement_resource_id: '1',
                resource_type: 'ATTACHMENT',
                display_name: 'file name',
                attachment_file_id: '1',
              },
            ],
          } as any);
          const { getByText } = await wrappedRender();
          const fileButton = getByText('file name');
          await fireEvent.click(fileButton);
          await waitFor(() => {
            expect(mockDownloadFile).toHaveBeenCalled();
          });
        });
      });
    });

    describe('when announcement has no attachment', () => {
      it('should display form', async () => {
        store.setAnnouncement({
          announcement_id: '1',
          title: 'title',
          description: 'description',
          active_on: new Date(),
          status: 'PUBLISHED',
          announcement_resource: [],
        } as any);
        const { getByLabelText } = await wrappedRender();
        const fileNameInput = getByLabelText('Display File Link As');
        const fileInput = getByLabelText('Attachment');
        expect(fileNameInput).toHaveValue('');
        expect(fileInput).toBeInTheDocument();
      });
    });

    describe('when announcement has a link', () => {
      it('should display link', async () => {
        store.setAnnouncement({
          announcement_id: '1',
          title: 'title',
          description: 'description',
          active_on: new Date().toDateString(),
          status: 'PUBLISHED',
          announcement_resource: [
            {
              announcement_resource_id: '1',
              resource_type: AnnouncementResourceType.ATTACHMENT,
              display_name: 'file name',
              attachment_file_id: '1',
              resource_url: '',
            },
            {
              announcement_resource_id: '2',
              resource_type: AnnouncementResourceType.LINK,
              display_name: 'link display name',
              resource_url: 'https://example.com',
              attachment_file_id: '',
            },
          ],
        } as any);
        const { getByRole } = await wrappedRender();
        expect(
          getByRole('link', { name: 'link display name' }),
        ).toBeInTheDocument();
        expect(getByRole('button', { name: 'Edit link' })).toBeInTheDocument();
        expect(
          getByRole('button', { name: 'Delete link' }),
        ).toBeInTheDocument();
      });

      describe('when link is deleted', () => {
        it('should remove link', async () => {
          store.setAnnouncement({
            announcement_id: '1',
            title: 'title',
            description: 'description',
            active_on: new Date(),
            status: 'PUBLISHED',
            announcement_resource: [
              {
                announcement_resource_id: '2',
                resource_type: AnnouncementResourceType.LINK,
                display_name: 'link display name',
                resource_url: 'https://example.com',
                attachment_file_id: '',
              },
            ],
          } as any);
          const { getByRole, getByLabelText } = await wrappedRender();
          const deleteButton = getByRole('button', { name: 'Delete link' });
          await fireEvent.click(deleteButton);
          const linkNameInput = getByLabelText('Display URL As');
          const linkUrlInput = getByLabelText('Link URL');
          await waitFor(() => {
            expect(linkNameInput).toHaveValue('');
            expect(linkUrlInput).toHaveValue('');
          });
        });
      });

      describe('when link edit is clicked', () => {
        it('should update link', async () => {
          store.setAnnouncement({
            announcement_id: '1',
            title: 'title',
            description: 'description',
            active_on: new Date(),
            status: 'PUBLISHED',
            announcement_resource: [
              {
                announcement_resource_id: '2',
                resource_type: AnnouncementResourceType.LINK,
                display_name: 'link display name',
                resource_url: 'https://example.com',
                attachment_file_id: '',
              },
            ],
          } as any);
          const { getByRole, getByLabelText } = await wrappedRender();
          const editButton = getByRole('button', { name: 'Edit link' });
          await fireEvent.click(editButton);
          const linkNameInput = getByLabelText('Display URL As');
          const linkURLInput = getByLabelText('Link URL');
          await waitFor(() => {
            expect(linkNameInput).toHaveValue('link display name');
            expect(linkURLInput).toHaveValue('https://example.com');
          });
        });
      });
    });
    describe('when announcement update fails', () => {
      it('should show error notification', async () => {
        store.setAnnouncement({
          announcement_id: '1',
          title: 'title',
          description: 'description',
          active_on: new Date(),
          status: 'PUBLISHED',
          announcement_resource: [
            {
              resource_type: 'LINK',
              display_name: 'link',
              resource_url: 'https://example.com',
            },
          ],
        } as any);
        mockUpdateAnnouncement.mockRejectedValueOnce(new Error('error'));
        const { getByRole } = await wrappedRender();

        const saveButton = getByRole('button', { name: 'Save' });

        await fireEvent.click(saveButton);
        await waitFor(async () => {
          const confirmButton = getByRole('button', { name: 'Confirm' });
          await fireEvent.click(confirmButton);
        });
        await waitFor(() => {
          expect(mockUpdateAnnouncement).toHaveBeenCalled();
          expect(mockError).toHaveBeenCalled();
        });
      });
    });
  });
});
