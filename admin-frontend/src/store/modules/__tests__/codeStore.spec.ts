import { createTestingPinia } from '@pinia/testing';
import { setActivePinia, storeToRefs } from 'pinia';
import { Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import { watch } from 'vue';
import ApiService from '../../../services/apiService';
import { authStore } from '../auth';
import { useCodeStore } from '../codeStore';

// ----------------------------------------------------------------------------
// Global Mocks
// ----------------------------------------------------------------------------

vi.mock('../../../common/apiService', async (importOriginal) => {
  const mod: any = await importOriginal();
  const resp = {
    ...mod,
    default: {
      ...mod.default,
      getEmployeeCountRanges: vi.fn(),
      getNaicsCodes: vi.fn(),
    },
  };
  return resp;
});

// ----------------------------------------------------------------------------
// Test Data
// ----------------------------------------------------------------------------

const testEmployeeCountRanges = [
  {
    employee_count_range_id: 'ea8b2547-4e93-4bfa-aec1-3e90f91027dd',
    employee_count_range: '1-99',
  },
  {
    employee_count_range_id: 'c7e1c454-7db9-46c6-b250-1567a543d22f',
    employee_count_range: '100-499',
  },
  {
    employee_count_range_id: '5f26cc90-7960-4e14-9700-87ecd75f0a0f',
    employee_count_range: '500+',
  },
];

const testNaicsCodes = [
  {
    naics_code: '1',
    naics_label: 'test1',
  },
  {
    naics_code: '2',
    naics_label: 'test2',
  },
  {
    naics_code: '3',
    naics_label: 'test3',
  },
];

// ----------------------------------------------------------------------------
// Test Suite
// ----------------------------------------------------------------------------

describe('CodeStore', () => {
  let codeStore;
  let auth;
  let pinia;

  beforeEach(() => {
    pinia = createTestingPinia({
      stubActions: false,
      fakeApp: true,
      createSpy: vi.fn,
    });
    setActivePinia(pinia);

    auth = authStore(pinia);
    codeStore = useCodeStore(pinia);
  });

  it('Fetches employee range count and naics code when auth status becomes true', async () => {
    // Mock functions in the ApiService which normally make HTTP requests to the backend.
    // Instead, have these functions return some test data without any HTTP requests.
    (ApiService.getEmployeeCountRanges as Mock).mockResolvedValueOnce(
      testEmployeeCountRanges,
    );
    (ApiService.getNaicsCodes as Mock).mockResolvedValueOnce(testNaicsCodes);

    // Setup "watches" on CodeStore state variables.  When the values of these
    // variables change, check that they are what we expect
    const { naicsCodes, employeeCountRanges } = storeToRefs(codeStore);
    watch(naicsCodes, (val) => {
      expect(naicsCodes.value?.length).toBe(testNaicsCodes.length);
      expect(naicsCodes.value[0].naics_code).toBe(testNaicsCodes[0].naics_code);
    });
    watch(employeeCountRanges, (val) => {
      expect(employeeCountRanges.value?.length).toBe(
        testEmployeeCountRanges.length,
      );
      expect(employeeCountRanges.value[0].employee_count_range_id).toBe(
        testEmployeeCountRanges[0].employee_count_range_id,
      );
    });

    // Setting the JWT Token in the AuthService triggers a function inside CodeStore
    // called fetchAllCodes().  This is the method that calls the ApiService to fetch
    // data, and then sets the data in state variables: naicsCodes and employeeCountRanges.
    // (The token isn't validated by auth.setJwtToken(), so even an invalid token should
    // cause the events described above)
    await auth.setJwtToken('fake token');
  });
});
