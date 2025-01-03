import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import ApiService from '../../services/apiService';
import {
  AnnouncementFilterType,
  AnnouncementSortType,
  AnnouncementStatus,
  IAnnouncementSearchParams,
  IAnnouncementSearchResult,
  IAnnouncementSearchUpdateParams,
  StatusFilter,
} from '../../types/announcements';

export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_SEARCH_PARAMS: IAnnouncementSearchParams = {
  page: 1,
  itemsPerPage: DEFAULT_PAGE_SIZE,
  filter: undefined,
  sort: [{ field: 'active_on', order: 'desc' }],
};

/*
Stores announcement search results and provides functions to fetch new 
search results.
*/
export const useAnnouncementSearchStore = defineStore(
  'announcementSearch',
  () => {
    //state
    //---------------------------------------------------------------------------

    const lastSubmittedSearchParams = ref<
      IAnnouncementSearchParams | undefined
    >(undefined);
    const searchResults = ref<any[] | undefined>(undefined);
    const totalNum = ref(0);
    const isSearching = ref(false);
    const isDownloadingCsv = ref(false);
    const pageSize = ref(DEFAULT_PAGE_SIZE);
    const hasSearched = computed(
      () => !isSearching.value && lastSubmittedSearchParams.value !== undefined,
    );

    //public actions
    //---------------------------------------------------------------------------

    /**
     * Launches a new announcement search against the API using the given parameters.
     * The parameters and results will be saved to this store.
     * No meaningful return value.
     */
    const searchAnnouncements = async (
      params: IAnnouncementSearchParams = {},
    ) => {
      const existingStoreSettings: IAnnouncementSearchParams = {};
      if (pageSize.value) {
        existingStoreSettings.itemsPerPage = pageSize.value;
      }
      const searchParams: any = {
        ...DEFAULT_SEARCH_PARAMS,
        ...existingStoreSettings,
        ...params,
      };

      const offset = (searchParams.page - 1) * searchParams.itemsPerPage;
      const limit = searchParams.itemsPerPage;
      let filters: AnnouncementFilterType = searchParams?.filter
        ? searchParams.filter
        : [];
      let sort = searchParams.sort;

      if (!sort?.length) {
        sort = DEFAULT_SEARCH_PARAMS.sort;
      }

      //Because the frontend should never see ARCHIVED announcements,
      //when no status filter is provided as a param to this function,
      //create a default status filter which includes all status except ARCHIVED.
      if (!filters?.filter((f) => f.key == 'status').length) {
        const allStatusesExceptArchived = [
          AnnouncementStatus.Published,
          AnnouncementStatus.Draft,
          AnnouncementStatus.Expired,
        ];
        const defaultStatusFilter: StatusFilter = {
          key: 'status',
          operation: 'in',
          value: allStatusesExceptArchived,
        };
        filters = [...filters, defaultStatusFilter];
      }

      isSearching.value = true;
      lastSubmittedSearchParams.value = params;

      try {
        const resp: IAnnouncementSearchResult =
          await ApiService.getAnnouncements(offset, limit, filters, sort);
        searchResults.value = resp?.items;
        totalNum.value = resp?.total;
      } catch (err) {
        console.log(`search failed: ${err}`);
      }
      isSearching.value = false;
    };

    /**
     * Search again using the same filters as the previous search, but
     * with updated values for 'page', 'itemsPerPage', and 'sortBy'.
     * This method is designed to work with the Vuetify's v-data-table-server,
     * which sends params in a specific format.
     * The parameters and results will be saved to this store.
     * No meaningful return value.
     */
    const updateSearch = async (params: IAnnouncementSearchUpdateParams) => {
      const paramsAgumented: IAnnouncementSearchParams = {
        page: params.page,
        itemsPerPage: params.itemsPerPage,
        sort: dataTableSortByToBackendSort(params.sortBy),
        filter: lastSubmittedSearchParams.value?.filter,
      };
      return searchAnnouncements(paramsAgumented);
    };

    /**
     * Repeats the most recent previous search with all the same params.
     * This is similar to updateSearch(), except that function only reuses
     * filters from the previous search, not also paging parameters like
     * this function.
     * The parameters and results will be saved to this store.
     * No meaningful return value.
     */
    const repeatSearch = async () => {
      if (lastSubmittedSearchParams.value) {
        return searchAnnouncements(lastSubmittedSearchParams.value);
      }
    };

    /**
     * resets back to the original state (i.e. clears any saved search results
     * and information about the previous search, and performs a fresh
     * search with no filters applied)
     */
    const reset = async () => {
      searchResults.value = undefined;
      totalNum.value = 0;
      pageSize.value = DEFAULT_PAGE_SIZE;
      lastSubmittedSearchParams.value = undefined;
      await searchAnnouncements(DEFAULT_SEARCH_PARAMS);
    };

    // Private actions
    //---------------------------------------------------------------------------

    /**
     * Transform a 'sortBy' array in the format used by Vuetify's v-data-table
     * into a 'sort' array in the format used by the backend's report search API.
     *   e.g. [{key: 'active_on', order: 'desc'}]
     *       => [{field: 'company_name', order: 'desc'}]
     */
    const dataTableSortByToBackendSort = (
      sortBy: any[] | undefined,
    ): AnnouncementSortType | undefined => {
      if (!sortBy) {
        return undefined;
      }
      const unfiltered = sortBy.map((s) => {
        return { field: s?.key, order: s?.order };
      });
      return unfiltered.filter((s) => s); //filter out null values
    };

    //---------------------------------------------------------------------------

    // Return the public interface for the store
    return {
      //state
      lastSubmittedSearchParams,
      searchResults,
      isSearching,
      isDownloadingCsv,
      totalNum,
      pageSize,
      hasSearched,
      //actions
      searchAnnouncements,
      updateSearch,
      repeatSearch,
      reset,
    };
  },
);
