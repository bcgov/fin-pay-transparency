import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import ApiService from '../../services/apiService';
import {
  IReportSearchParams,
  IReportSearchResult,
  IReportSearchSort,
  IReportSearchUpdateParams,
  SORT_KEY_MAPPING,
} from '../../types';

export const DEFAULT_PAGE_SIZE = 100;
export const DEFAULT_SEARCH_PARAMS: IReportSearchParams = {
  page: 1,
  itemsPerPage: 20,
  filter: undefined,
  sort: [{ update_date: 'desc' }],
};

/*
Stores report search results and provides functions to fetch new 
report search results.
*/
export const useReportSearchStore = defineStore('reportSearch', () => {
  //state
  //---------------------------------------------------------------------------

  const lastSubmittedReportSearchParams = ref<IReportSearchParams | undefined>(
    undefined,
  );
  const searchResults = ref<any[] | undefined>(undefined);
  const totalNum = ref(0);
  const isSearching = ref(false);
  const pageSize = ref(DEFAULT_PAGE_SIZE);
  const hasSearched = computed(
    () =>
      !isSearching.value && lastSubmittedReportSearchParams.value !== undefined,
  );

  //public actions
  //---------------------------------------------------------------------------

  /* 
  Launches a new report search against the API using the given parameters.
  The parameters and results will be saved to this store.  
  No meaningful return value.
   */
  const searchReports = async (params: IReportSearchParams = {}) => {
    const searchParams: any = { ...DEFAULT_SEARCH_PARAMS, ...params };

    const offset = (searchParams.page - 1) * searchParams.itemsPerPage;
    const limit = params.itemsPerPage;
    const filter = params.filter;
    let sort = params.sort;

    if (!sort?.length) {
      sort = DEFAULT_SEARCH_PARAMS.sort;
    }

    isSearching.value = true;
    lastSubmittedReportSearchParams.value = params;

    try {
      const resp: IReportSearchResult = await ApiService.getReports(
        offset,
        limit,
        filter,
        sort,
      );
      searchResults.value = resp?.reports;
      totalNum.value = resp?.total;
    } catch (err) {
      console.log(`search failed: ${err}`);
    }
    isSearching.value = false;
  };

  /* 
  Search again using the same filters as the previous search, but 
  with updated values for 'page', 'itemsPerPage', and 'sortBy'.
  This method is designed to work with the Vuetify's v-data-table-server,
  which sends params in a specific format.
  The parameters and results will be saved to this store. 
  No meaningful return value.
  */
  const updateSearch = async (params: IReportSearchUpdateParams) => {
    const paramsAgumented: IReportSearchParams = {
      page: params.page,
      itemsPerPage: params.itemsPerPage,
      sort: dataTableSortByToBackendSort(params.sortBy),
      filter: lastSubmittedReportSearchParams.value?.filter,
    };
    return searchReports(paramsAgumented);
  };

  /*
  Repeats the most recent previous search with all the same params.  
  This is similar to updateSearch(), except that function only reuses
  filters from the previous search, not also paging parameters like
  this function.
  The parameters and results will be saved to this store. 
  No meaningful return value.
  */
  const repeatSearch = async () => {
    if (lastSubmittedReportSearchParams.value) {
      return searchReports(lastSubmittedReportSearchParams.value);
    }
  };

  /*
  resets back to the original state (i.e. clears any saved search results 
  and information about the previous search, and performs a fresh 
  search with no filters applied) 
  */
  const reset = async () => {
    searchResults.value = undefined;
    totalNum.value = 0;
    pageSize.value = DEFAULT_PAGE_SIZE;
    lastSubmittedReportSearchParams.value = undefined;
    await searchReports(DEFAULT_SEARCH_PARAMS);
  };

  // Private actions
  //---------------------------------------------------------------------------

  /*
  Transform a 'sortBy' array in the format used by Vuetify's v-data-table
  into a 'sort' array in the format used by the backend's report search API.
  e.g. [{key: "pay_transparency_company.company_name", order: "desc"}] 
        => [{company_name: "desc"}]
  */
  const dataTableSortByToBackendSort = (
    sortBy: any[] | undefined,
  ): IReportSearchSort => {
    if (!sortBy) {
      return undefined;
    }
    const unfiltered = sortBy.map((s) => {
      if (!s?.key) {
        return undefined;
      }
      const sortKey = SORT_KEY_MAPPING[s.key];
      if (!sortKey) {
        return undefined;
      }
      const obj = {};
      obj[sortKey] = s.order ? s.order : 'asc';
      return obj;
    });
    return unfiltered.filter((s) => s); //filter out null values
  };

  //---------------------------------------------------------------------------

  // Return the public interface for the store
  return {
    //state
    lastSubmittedReportSearchParams,
    searchResults,
    isSearching,
    totalNum,
    pageSize,
    hasSearched,
    //actions
    searchReports,
    updateSearch,
    repeatSearch,
    reset,
  };
});
