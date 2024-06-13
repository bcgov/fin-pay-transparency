import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import ApiService from '../../services/apiService';
import {
  IReportSearchParams,
  IReportSearchResult,
  IReportSearchSort,
  IReportSearchUpdateParams,
  SORT_KEY_MAPPING,
} from '../../types';

const DEFAULT_PAGE_SIZE = 20;

/*
Stores report search results and provides functions to fetch new 
report search results.
*/
export const useReportSearchStore = defineStore('code', () => {
  //private state
  let lastSubmittedFilter: any[] | undefined = undefined;

  //public state
  const searchResults = ref<any[] | undefined>(undefined);
  const totalNum = ref(0);
  const isSearching = ref(false);
  const pageSize = ref(DEFAULT_PAGE_SIZE);
  const isDirty = computed(
    () =>
      searchResults.value !== undefined ||
      totalNum.value !== 0 ||
      pageSize.value !== DEFAULT_PAGE_SIZE ||
      lastSubmittedFilter !== undefined,
  );

  //public actions
  //---------------------------------------------------------------------------

  /* 
  Launches a new report search against the API using the given parameters.
  The parameters and results will be saved to this store
   */
  const searchReports = async (params: IReportSearchParams) => {
    const defaults: IReportSearchParams = {
      page: 1,
      itemsPerPage: 20,
      filter: undefined,
      sort: undefined,
    };
    params = { ...defaults, ...params };

    const offset = (params.page - 1) * params.itemsPerPage;
    const limit = params.itemsPerPage;
    const filter = params.filter;
    const sort = params.sort;

    isSearching.value = true;
    lastSubmittedFilter = filter;

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
  */
  const updateSearch = (params: IReportSearchUpdateParams) => {
    const paramsAgumented: IReportSearchParams = {
      ...params,
      sort: dataTableSortByToBackendSort(params.sortBy),
      filter: lastSubmittedFilter,
    };
    return searchReports(paramsAgumented);
  };

  const reset = () => {
    searchResults.value = undefined;
    totalNum.value = 0;
    pageSize.value = DEFAULT_PAGE_SIZE;
    lastSubmittedFilter = undefined;
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
    searchResults,
    isSearching,
    totalNum,
    pageSize,
    isDirty,
    //actions
    searchReports,
    updateSearch,
    reset,
  };
});
