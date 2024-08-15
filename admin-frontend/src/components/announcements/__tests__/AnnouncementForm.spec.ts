import { createTestingPinia } from '@pinia/testing';
import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import AnnouncementForm from '../AnnouncementForm.vue';

global.ResizeObserver = require('resize-observer-polyfill');
const pinia = createTestingPinia();
const vuetify = createVuetify({ components, directives });

const mockGetAnnouncements = vi.fn().mockResolvedValue({ items: [] });

vi.mock('../../../services/apiService', () => ({
  default: {
    getAnnouncements: (...args) => {
      return mockGetAnnouncements(...args);
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

describe('AnnouncementForm', () => {
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
