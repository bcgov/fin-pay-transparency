import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import ReportSearchFilters from '../ReportSearchFilters.vue';

// Mock the ResizeObserver
const ResizeObserverMock = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Stub blobal objects needed for testing
vi.stubGlobal('ResizeObserver', ResizeObserverMock);
vi.stubGlobal('URL', { createObjectURL: vi.fn() });

describe('ReportSearchFilters', () => {
  let wrapper;
  let pinia;

  const initWrapper = async (options: any = {}) => {
    const vuetify = createVuetify({
      components,
      directives,
    });

    pinia = createTestingPinia({
      initialState: {},
    });
    wrapper = mount(ReportSearchFilters, {
      global: {
        plugins: [vuetify, pinia],
      },
    });

    //wait for the async component to load
    await flushPromises();
  };

  beforeEach(async () => {
    await initWrapper();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('getReportSearchFilters', () => {
    describe(`after 'clear' is called`, () => {
      it('produces an empty filters array', async () => {
        wrapper.vm.clear();
        const filters = wrapper.vm.getReportSearchFilters();
        expect(filters).toStrictEqual([]);
      });
    });
    describe(`when the naics code list has two items selected (and all other filters in the UI are empty)`, () => {
      it('produces a valid filters array', async () => {
        wrapper.vm.clear();
        const twoMockNaicsObjects = [
          { naics_code: 'mock-naics-1', naics_label: 'mock-naics-label-1' },
          { naics_code: 'mock-naics-2', naics_label: 'mock-naics-label-2' },
        ];
        wrapper.vm.selectedNaicsCodes = twoMockNaicsObjects;
        const filters = wrapper.vm.getReportSearchFilters();
        const naicsFilters = filters.filter((d) => d.key == 'naics_code');
        expect(naicsFilters.length).toBe(1);
        expect(naicsFilters[0].operation).toBe('in');
        expect(naicsFilters[0].value).toStrictEqual(
          twoMockNaicsObjects.map((d) => d.naics_code),
        );
      });
    });
    describe(`when the submission date range is specified (and all other filters in the UI are empty)`, () => {
      it('produces a valid filters array', async () => {
        wrapper.vm.clear();
        const d1 = '2024-04-17T00:00:00Z';
        const d2 = '2024-05-17T00:00:00Z';
        const dateRange = [new Date(d1), new Date(d2)];
        wrapper.vm.submissionDateRange = dateRange;
        const filters = wrapper.vm.getReportSearchFilters();
        const submissonDateFilters = filters.filter(
          (d) => d.key == 'create_date',
        );
        expect(submissonDateFilters.length).toBe(1);
        expect(submissonDateFilters[0].operation).toBe('between');
        expect(submissonDateFilters[0].value.length).toBe(2);
      });
    });
    describe(`when the report year is specified (and all other filters in the UI are empty)`, () => {
      it('produces a valid filters array', async () => {
        wrapper.vm.clear();
        const mockYear = 2024;
        wrapper.vm.selectedReportYear = mockYear;
        const filters = wrapper.vm.getReportSearchFilters();
        const reportYearFilters = filters.filter(
          (d) => d.key == 'reporting_year',
        );
        expect(reportYearFilters.length).toBe(1);
        expect(reportYearFilters[0].operation).toBe('eq');
        expect(reportYearFilters[0].value).toBe(mockYear);
      });
    });
    describe(`when the employee count is specified (and all other filters in the UI are empty)`, () => {
      it('produces a valid filters array', async () => {
        wrapper.vm.clear();
        const twoMockEmpCountRanges = [
          {
            employee_count_range: '1-50',
            employee_count_range_id: 'mock-emp-count-range-id-1',
          },
          {
            employee_count_range: '51-100',
            employee_count_range_id: 'mock-emp-count-range-id-2',
          },
        ];
        wrapper.vm.selectedEmployeeCount = twoMockEmpCountRanges;
        const filters = wrapper.vm.getReportSearchFilters();
        const empCountFilters = filters.filter(
          (d) => d.key == 'employee_count_range_id',
        );
        expect(empCountFilters.length).toBe(1);
        expect(empCountFilters[0].operation).toBe('in');
        expect(empCountFilters[0].value).toStrictEqual(
          twoMockEmpCountRanges.map((d) => d.employee_count_range_id),
        );
      });
    });
    describe(`when the report year is specified (and all other filters in the UI are empty)`, () => {
      it('produces a valid filters array', async () => {
        wrapper.vm.clear();
        const isUnlocked = false;
        wrapper.vm.selectedLockedValues = isUnlocked ? 'Unlocked' : 'Locked';
        const filters = wrapper.vm.getReportSearchFilters();
        const reportYearFilters = filters.filter((d) => d.key == 'is_unlocked');
        expect(reportYearFilters.length).toBe(1);
        expect(reportYearFilters[0].operation).toBe('eq');
        expect(reportYearFilters[0].value).toBe(isUnlocked);
      });
    });
  });
});
