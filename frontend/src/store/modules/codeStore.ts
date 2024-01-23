import { defineStore, storeToRefs } from 'pinia';
import { ref, watch } from 'vue';
import ApiService from '../../common/apiService';
import { REPORT_STATUS } from '../../utils/constant';
import { authStore } from './auth.js';

/*
The CodeStore houses static data that is ultimately to be used to populate 
lists of options in the UI.  It is responsible for fetching 
those data from the backend and sharing them via a reactive interface.
*/
export const useCodeStore = defineStore('code', () => {

  const auth = authStore();
  const { isAuthenticated } = storeToRefs(auth)

  const employeeCountRanges = ref([]);
  const naicsCodes = ref([]);
  const reports = ref([]);

  const setEmployeeCountRanges = (val) => {
    employeeCountRanges.value = val;
  }
  const setNaicsCodes = (val) => {
    naicsCodes.value = val;
  }
  const setReports = (val) => {
    reports.value = val;
  }  

  const fetchAllCodes = async () => {
    const employeeCountRanges = await ApiService.getEmployeeCountRanges()
    setEmployeeCountRanges(employeeCountRanges)


    const naicsCodes = await ApiService.getNaicsCodes()
    setNaicsCodes(naicsCodes)

    const reports = await ApiService.getReportsByStatus(REPORT_STATUS.PUBLISHED)
    setReports(reports)
  }

  // Watch for changes to the isAuthenticated property in the AuthStore.  When set 
  // to true initiate API calls to fetch static data from the backend. (The API 
  // calls require a token showing the user is authenticated.)
  watch(
    isAuthenticated,
    async (isAuthenticated) => {
      if (isAuthenticated) {
        fetchAllCodes();
      }
    },
    { immediate: true }
  )

  // Return the public interface for the store
  return {
    employeeCountRanges,
    naicsCodes,
    reports
  }
})