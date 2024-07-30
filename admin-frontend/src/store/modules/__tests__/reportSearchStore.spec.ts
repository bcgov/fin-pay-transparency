import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ApiService from '../../../services/apiService';
import {
  IReportSearchParams,
  IReportSearchUpdateParams,
} from '../../../types/reports';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_SEARCH_PARAMS,
  useReportSearchStore,
} from '../reportSearchStore';

const mockGetReports = vi.fn();
vi.mock('../../../services/apiService', async (importOriginal) => {
  const mod: any = await importOriginal();
  return {
    default: {
      ...mod.default,
      getReports: () => mockGetReports(),
    },
  };
});

describe('reportSearchStore', () => {
  let reportSearchStore;
  let auth;
  let pinia;

  beforeEach(() => {
    pinia = createTestingPinia({
      stubActions: false,
      fakeApp: true,
      createSpy: vi.fn,
    });
    setActivePinia(pinia);

    reportSearchStore = useReportSearchStore(pinia);
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('searchReports', () => {
    it('should update the store with reports matching the search params', async () => {
      const params: IReportSearchParams = {
        page: 1,
        itemsPerPage: 3,
        filter: [],
        sort: [],
      };
      const mockGetReportsResponse = {
        reports: [
          {
            report_id: '1119e398-22e7-4d10-93aa-8b2112b4e74f',
          },
          {
            report_id: '24df5544-78e2-aa1c-97aa-8b2112b4556a',
          },
        ],
        offset: 0,
        limit: params.itemsPerPage,
        total: 2,
        totalPages: 1,
      };
      mockGetReports.mockResolvedValue(mockGetReportsResponse);

      await reportSearchStore.searchReports(params);

      expect(mockGetReports).toBeCalledTimes(1);
      expect(reportSearchStore.searchResults?.length).toBe(
        mockGetReportsResponse.reports.length,
      );
      expect(reportSearchStore.totalNum).toBe(mockGetReportsResponse.total);
      expect(reportSearchStore.isSearching).toBeFalsy();
      expect(reportSearchStore.lastSubmittedReportSearchParams).toStrictEqual(
        params,
      );
    });
  });

  describe('updateSearch', () => {
    it('should update the store with reports matching the search params', async () => {
      const prevSearchParams = {
        page: 1,
        itemsPerPage: 1,
        filter: [],
        sort: [],
      };
      const updateParams: IReportSearchUpdateParams = {
        page: prevSearchParams.page + 1,
        itemsPerPage: prevSearchParams.itemsPerPage,
        sortBy: prevSearchParams.sort,
      };
      const mockGetReportsResponse = {
        reports: [
          {
            report_id: '1119e398-22e7-4d10-93aa-8b2112b4e74f',
          },
        ],
        offset: updateParams.page - 1,
        limit: updateParams.itemsPerPage,
        total: 2,
        totalPages: updateParams.page,
      };
      reportSearchStore.lastSubmittedReportSearchParams = prevSearchParams;
      mockGetReports.mockResolvedValue(mockGetReportsResponse);

      await reportSearchStore.updateSearch(updateParams);

      expect(mockGetReports).toBeCalledTimes(1);
      expect(reportSearchStore.searchResults?.length).toBe(
        mockGetReportsResponse.reports.length,
      );
      expect(reportSearchStore.totalNum).toBe(mockGetReportsResponse.total);
      expect(reportSearchStore.isSearching).toBeFalsy();
      expect(reportSearchStore.lastSubmittedReportSearchParams).toStrictEqual({
        page: updateParams.page,
        itemsPerPage: updateParams.itemsPerPage,
        filter: prevSearchParams.filter,
        sort: updateParams.sortBy,
      });
    });
  });

  describe('repeatSearch', () => {
    it('should re-run the previous search', async () => {
      const params: IReportSearchParams = {
        page: 1,
        itemsPerPage: 3,
        filter: [],
        sort: [],
      };
      const mockGetReportsResponse = {
        reports: [
          {
            report_id: '1119e398-22e7-4d10-93aa-8b2112b4e74f',
          },
          {
            report_id: '24df5544-78e2-aa1c-97aa-8b2112b4556a',
          },
        ],
        offset: 0,
        limit: params.itemsPerPage,
        total: 2,
        totalPages: 1,
      };
      mockGetReports.mockResolvedValue(mockGetReportsResponse);

      await reportSearchStore.searchReports(params);
      expect(mockGetReports).toBeCalledTimes(1);
      const searchResults1 = [...reportSearchStore.searchResults];
      const totalNum1 = reportSearchStore.totalNum;
      const lastParams = {
        ...reportSearchStore.lastSubmittedReportSearchParams,
      };

      await reportSearchStore.repeatSearch();
      expect(mockGetReports).toBeCalledTimes(2);
      expect(searchResults1).toStrictEqual(reportSearchStore.searchResults);
      expect(totalNum1).toStrictEqual(reportSearchStore.totalNum);
      expect(lastParams).toStrictEqual(
        reportSearchStore.lastSubmittedReportSearchParams,
      );
    });
  });

  describe('reset', () => {
    it('the store should be returned to its original state', async () => {
      reportSearchStore.searchResults = [{}, {}, {}];
      reportSearchStore.pageSize = 5;
      reportSearchStore.totalNum = reportSearchStore.searchResults.length;
      reportSearchStore.lastSubmittedReportSearchParams = {};

      const mockGetReportsResponse = {
        reports: [
          {
            report_id: '1119e398-22e7-4d10-93aa-8b2112b4e74f',
          },
          {
            report_id: '24df5544-78e2-aa1c-97aa-8b2112b4556a',
          },
        ],
        total: 2,
      };
      mockGetReports.mockResolvedValue(mockGetReportsResponse);

      await reportSearchStore.reset();

      expect(reportSearchStore.pageSize).toBe(DEFAULT_PAGE_SIZE);
      expect(reportSearchStore.totalNum).toStrictEqual(
        mockGetReportsResponse.total,
      );
      expect(reportSearchStore.lastSubmittedReportSearchParams).toStrictEqual(
        DEFAULT_SEARCH_PARAMS,
      );
    });
  });

  describe('downloadReportsCsv', () => {
    describe('given filter and sort', () => {
      it('delegates to the ApiService, passing the given filter and sort', async () => {
        const params: IReportSearchParams = {
          filter: [],
          sort: [{ reporting_year: 'desc' }],
        };
        const spy = vi
          .spyOn(ApiService, 'downloadReportsCsv')
          .mockResolvedValue();

        await reportSearchStore.downloadReportsCsv(params);

        expect(spy.mock.calls[0][0]).toBe(params.filter);
        expect(spy.mock.calls[0][1]).toBe(params.sort);
        expect(reportSearchStore.isDownloadingCsv).toBeFalsy();
      });
    });
    describe('given empty filter and empty sort', () => {
      it('delegates to the ApiService, passing a default sort', async () => {
        const params: IReportSearchParams = {
          filter: [],
          sort: [],
        };
        const spy = vi
          .spyOn(ApiService, 'downloadReportsCsv')
          .mockResolvedValue();

        await reportSearchStore.downloadReportsCsv(params);

        expect(spy.mock.calls[0][0]).toBe(params.filter);
        expect(spy.mock.calls[0][1]).toBe(DEFAULT_SEARCH_PARAMS.sort);
        expect(reportSearchStore.isDownloadingCsv).toBeFalsy();
      });
    });
  });
});
