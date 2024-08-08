import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IAnnouncementSearchParams } from '../../../types/announcements';
import { useAnnouncementSearchStore } from '../announcementSearchStore';

const mockGetAnnouncements = vi.fn();
vi.mock('../../../services/apiService', async (importOriginal) => {
  const mod: any = await importOriginal();
  return {
    default: {
      ...mod.default,
      getAnnouncements: () => mockGetAnnouncements(),
    },
  };
});

describe('announcementSearchStore', () => {
  let announcementSearchStore;
  let auth;
  let pinia;

  beforeEach(() => {
    pinia = createTestingPinia({
      stubActions: false,
      fakeApp: true,
      createSpy: vi.fn,
    });
    setActivePinia(pinia);

    announcementSearchStore = useAnnouncementSearchStore(pinia);
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('searchAnnouncements', () => {
    it('should update the store with announcements matching the search params', async () => {
      const params: IAnnouncementSearchParams = {
        page: 1,
        itemsPerPage: 3,
        filter: [],
        sort: [],
      };
      const mockGetAnnouncementsResponse = {
        items: [
          {
            announcement_id: '1119e398-22e7-4d10-93aa-8b2112b4e74f',
          },
          {
            announcement_id: '24df5544-78e2-aa1c-97aa-8b2112b4556a',
          },
        ],
        offset: 0,
        limit: params.itemsPerPage,
        total: 2,
        totalPages: 1,
      };
      mockGetAnnouncements.mockResolvedValue(mockGetAnnouncementsResponse);

      await announcementSearchStore.searchAnnouncements(params);

      expect(mockGetAnnouncements).toBeCalledTimes(1);
      expect(announcementSearchStore.searchResults?.length).toBe(
        mockGetAnnouncementsResponse.items.length,
      );
      expect(announcementSearchStore.totalNum).toBe(
        mockGetAnnouncementsResponse.total,
      );
      expect(announcementSearchStore.isSearching).toBeFalsy();
      expect(announcementSearchStore.lastSubmittedSearchParams).toStrictEqual(
        params,
      );
    });
  });
});
