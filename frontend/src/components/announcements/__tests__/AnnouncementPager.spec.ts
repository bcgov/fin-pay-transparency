import { fireEvent, screen } from '@testing-library/vue';
import { renderWithPlugins } from '../../../test-utils/vuetify';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Announcement } from '../../../types/announcements';
import AnnouncementPager from '../AnnouncementPager.vue';

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
  return renderWithPlugins(AnnouncementPager, {
    props,
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
