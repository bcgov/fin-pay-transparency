import { beforeEach, describe, it, vi, expect } from 'vitest';
import EditAnnouncementPage from '../EditAnnouncementPage.vue';
import { fireEvent, render, waitFor } from '@testing-library/vue';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { createVuetify } from 'vuetify';
import { createTestingPinia } from '@pinia/testing';
import { createPinia, setActivePinia } from 'pinia';
import { useAnnouncementSelectionStore } from '../../store/modules/announcementSelectionStore';

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
vi.mock('../../services/apiService', () => ({
  default: {
    updateAnnouncement: (...args) => mockUpdateAnnouncement(...args),
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
        const { queryByRole } = await wrappedRender();
        expect(queryByRole('radio', { name: 'Draft' })).toBeNull();
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
        const { getByRole } = await wrappedRender();
        expect(getByRole('radio', { name: 'Draft' })).toBeInTheDocument();
        expect(getByRole('radio', { name: 'Publish' })).toBeInTheDocument();
      });
    });

    describe('when announcement is updated', () => {
      it('should show success notification', async () => {
        store.setAnnouncement({
          title: 'title',
          description: 'description',
          published_on: new Date(),
          status: 'PUBLISHED',
          announcement_resource: [
            {
              resource_type: 'LINK',
              display_name: 'link',
              resource_url: 'https://example.com',
            },
          ],
        } as any);
        const { getByRole, getByLabelText } = await wrappedRender();
        expect(getByRole('radio', { name: 'Publish' })).toBeChecked();
        expect(getByLabelText('Title')).toHaveValue('title');
        expect(getByLabelText('Description')).toHaveValue('description');
        expect(getByLabelText('Display Link As')).toHaveValue('link');
        expect(getByLabelText('Link URL')).toHaveValue('https://example.com');
        const saveButton = getByRole('button', { name: 'Save' });
        await fireEvent.click(saveButton);
        await waitFor(() => {
          expect(mockUpdateAnnouncement).toHaveBeenCalled();
          expect(mockSuccess).toHaveBeenCalled();
        });
      });
    });

    describe('when announcement update fails', () => {
      it('should show error notification', async () => {
        store.setAnnouncement({
          title: 'title',
          description: 'description',
          published_on: new Date(),
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
        const { getByRole, getByLabelText } = await wrappedRender();
        const saveButton = getByRole('button', { name: 'Save' });
        await fireEvent.click(saveButton);
        await waitFor(() => {
          expect(mockUpdateAnnouncement).toHaveBeenCalled();
          expect(mockError).toHaveBeenCalled();
        });
      });
    });
  });
});
