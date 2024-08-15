import { createTestingPinia } from '@pinia/testing';
import { fireEvent, render, screen } from '@testing-library/vue';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { Announcement } from '../../../types/announcements';
import AnnouncementPager from '../AnnouncementPager.vue';

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

const wrappedRender = (props: {
  announcements: Announcement[];
  pageSize: number;
}) => {
  return render(AnnouncementPager, {
    props,
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

describe('AnnouncementPager', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('preview button becomes enabled when title and desc are provided', async () => {
    const mockAnnouncements: any = [
      {
        title: 'Mock announcement 1',
        description: 'Mock description 1',
      },
      {
        title: 'Mock announcement 2',
        description: 'Mock description 2',
      },
      {
        title: 'Mock announcement 3',
        description: 'Mock description 3',
      },
    ];
    const pageSize = 2;
    await wrappedRender({
      announcements: mockAnnouncements,
      pageSize: pageSize,
    });

    //page 1 contains only the first two announcements
    expect(screen.queryByText(mockAnnouncements[0].title)).toBeTruthy();
    expect(screen.queryByText(mockAnnouncements[1].title)).toBeTruthy();
    expect(screen.queryByText(mockAnnouncements[2].title)).toBeFalsy();

    const nextButton = screen.getByRole('button', { name: 'Next page' });
    await fireEvent.click(nextButton);

    //page 2 contains only the third announcement
    expect(screen.queryByText(mockAnnouncements[0].title)).toBeFalsy();
    expect(screen.queryByText(mockAnnouncements[1].title)).toBeFalsy();
    expect(screen.queryByText(mockAnnouncements[2].title)).toBeTruthy();
  });
});
