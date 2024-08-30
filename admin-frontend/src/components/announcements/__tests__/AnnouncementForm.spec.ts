import { createTestingPinia } from '@pinia/testing';
import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import AnnouncementForm from '../AnnouncementForm.vue';

global.ResizeObserver = require('resize-observer-polyfill');
const pinia = createTestingPinia();
const vuetify = createVuetify({ components, directives });

const mockGetAnnouncements = vi.fn().mockResolvedValue({ items: [] });
const mockClamavScan = vi.fn();

vi.mock('../../../services/apiService', () => ({
  default: {
    getAnnouncements: (...args) => {
      return mockGetAnnouncements(...args);
    },
    clamavScanFile: (...args) => {
      return mockClamavScan;
    },
  },
}));

const wrappedRender = async () => {
  return render(AnnouncementForm, {
    global: {
      plugins: [pinia, vuetify],
    },
  });
};

const fillTitleAndDesc = async () => {
  const title = screen.getByLabelText('Title');
  const description = screen.getByLabelText('Description');
  await fireEvent.update(title, 'Test Title');
  await fireEvent.update(description, 'Test Description');
};

describe('AnnouncementForm - Vue Testing Library tests', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('preview button becomes enabled when title and desc are provided', async () => {
    const { getByRole, getByLabelText } = await wrappedRender();
    const previewButton = getByRole('button', { name: 'Preview' });
    const title = getByLabelText('Title');
    const description = getByLabelText('Description');
    expect(previewButton).not.toBeEnabled();
    await fireEvent.update(title, 'Test Title');
    expect(previewButton).not.toBeEnabled();
    await fireEvent.update(description, 'Test Description');
    expect(previewButton).toBeEnabled();
  });

  it('preview panel appears when preview button is clicked, and disappear when close is clicked', async () => {
    await wrappedRender();
    await fillTitleAndDesc();
    const previewButton = screen.getByRole('button', { name: 'Preview' });
    expect(previewButton).toBeEnabled();
    await fireEvent.click(previewButton);

    //check that preview panel appeared
    await waitFor(() => {
      expect(screen.queryByText('Preview Announcement')).toBeInTheDocument();
    });

    //Fill in the link details
    const linkDisplayName = screen.getByLabelText('Display Link As');
    const linkUrl = screen.getByLabelText('Link URL');
    await fireEvent.update(linkDisplayName, 'MockLinkName');
    await fireEvent.update(linkUrl, 'MockUrl');

    const closePreviewButton = screen.getByRole('button', {
      name: 'Close preview',
    });
    await fireEvent.click(closePreviewButton);

    //check that preview panel disappeared
    await waitFor(() => {
      expect(
        screen.queryByText('Preview Announcement'),
      ).not.toBeInTheDocument();
    });
  });
});

describe('AnnouncementItem - Vue Test Utils tests', () => {
  let wrapper;
  let pinia;

  const initWrapper = async (options: any = {}) => {
    const vuetify = createVuetify({
      components,
      directives,
    });

    pinia = createTestingPinia({
      initialState: {},
    });
    wrapper = mount(AnnouncementForm, {
      global: {
        plugins: [vuetify, pinia],
      },
    });

    //wait for the async component to load
    await flushPromises();
  };

  beforeEach(async () => {
    await initWrapper();
  });

  afterEach(() => {
    if (wrapper) {
      vi.clearAllMocks();
      wrapper.unmount();
    }
  });

  describe('buildAnnouncementToPreview', () => {
    describe('when link and attachment details are provided', () => {
      it('builds an announcement with resources', async () => {
        wrapper.vm.announcementTitle = 'title';
        wrapper.vm.announcementDescription = 'desc';
        wrapper.vm.linkDisplayName = 'link name';
        wrapper.vm.linkUrl = 'url';
        wrapper.vm.attachment = 'attachment';
        wrapper.vm.fileDisplayName = 'file display name';
        const announcement = wrapper.vm.buildAnnouncementToPreview();
        expect(
          announcement.announcement_resource.find(
            (r) => r.resource_type == 'LINK',
          ),
        ).toBeTruthy();
        expect(
          announcement.announcement_resource.find(
            (r) => r.resource_type == 'ATTACHMENT',
          ),
        ).toBeTruthy();
      });
    });
  });
});
