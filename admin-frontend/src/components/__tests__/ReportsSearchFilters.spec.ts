import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import ReportSearchFilters from '../ReportSearchFilters.vue';
import { useReportSearchStore } from '../../store/modules/reportSearchStore';

vi.mock('./DateRangeFilter.vue', () => ({
  default: {
    name: 'DateRangeFilter',
    props: ['modelValue', 'label'],
    emits: ['update:modelValue'],
    template: '<div data-testid="date-range-filter" />',
  },
}));

describe('ReportSearchFilters', () => {
  let wrapper;
  let pinia;

  const initWrapper = async () => {
    const vuetify = createVuetify({ components, directives });
    pinia = createTestingPinia({ initialState: {} });
    wrapper = mount(ReportSearchFilters, {
      global: { plugins: [vuetify, pinia] },
    });
    await flushPromises();
  };

  beforeEach(async () => {
    await initWrapper();
  });

  afterEach(() => {
    wrapper?.unmount();
  });

  // ---------------------------------------------------------------------------
  // Initial render
  // ---------------------------------------------------------------------------

  describe('initial render', () => {
    it('renders the Search button', () => {
      expect(wrapper.find('.btn-primary').text()).toBe('Search');
    });

    it('renders the Filter button', () => {
      expect(wrapper.text()).toContain('Filter');
    });

    it('does not show secondary filters by default', () => {
      expect(wrapper.find('.secondary-filters').exists()).toBe(false);
    });

    it('disables the Reset button when no filters are dirty', () => {
      const resetBtn = wrapper
        .findAll('button')
        .find((b) => b.text() === 'Reset');
      expect(resetBtn.attributes('disabled')).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // toggleSecondaryFiltersVisible
  // ---------------------------------------------------------------------------

  describe('toggleSecondaryFiltersVisible', () => {
    it('shows secondary filters after one toggle', async () => {
      wrapper.vm.toggleSecondaryFiltersVisible();
      await flushPromises();
      expect(wrapper.find('.secondary-filters').exists()).toBe(true);
    });

    it('hides secondary filters after two toggles', async () => {
      wrapper.vm.toggleSecondaryFiltersVisible();
      wrapper.vm.toggleSecondaryFiltersVisible();
      await flushPromises();
      expect(wrapper.find('.secondary-filters').exists()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // isDirty
  // ---------------------------------------------------------------------------

  describe('isDirty', () => {
    it('returns false on initial state', () => {
      expect(wrapper.vm.isDirty()).toBe(false);
    });

    it('returns true when searchText has a non-empty value', () => {
      wrapper.vm.searchText = 'Acme';
      expect(wrapper.vm.isDirty()).toBe(true);
    });

    it('returns false when searchText is only whitespace', () => {
      wrapper.vm.searchText = '   ';
      expect(wrapper.vm.isDirty()).toBe(false);
    });

    it('returns true when secondary filters are visible', () => {
      wrapper.vm.areSecondaryFiltersVisible = true;
      expect(wrapper.vm.isDirty()).toBe(true);
    });

    it('returns true when a secondary filter is dirty', () => {
      wrapper.vm.selectedReportYear = 2024;
      expect(wrapper.vm.isDirty()).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // areSecondaryFiltersDirty
  // ---------------------------------------------------------------------------

  describe('areSecondaryFiltersDirty', () => {
    it('returns false on initial state', () => {
      expect(wrapper.vm.areSecondaryFiltersDirty()).toBe(false);
    });

    it('returns true when submissionDateRange is set', () => {
      wrapper.vm.submissionDateRange = [new Date(), new Date()];
      expect(wrapper.vm.areSecondaryFiltersDirty()).toBe(true);
    });

    it('returns true when selectedNaicsCodes is non-empty', () => {
      wrapper.vm.selectedNaicsCodes = [
        { naics_code: '11', naics_label: 'Agriculture' },
      ];
      expect(wrapper.vm.areSecondaryFiltersDirty()).toBe(true);
    });

    it('returns true when selectedReportYear is set', () => {
      wrapper.vm.selectedReportYear = 2023;
      expect(wrapper.vm.areSecondaryFiltersDirty()).toBe(true);
    });

    it('returns true when selectedLockedValues is set', () => {
      wrapper.vm.selectedLockedValues = 'Locked';
      expect(wrapper.vm.areSecondaryFiltersDirty()).toBe(true);
    });

    it('returns true when selectedEmployeeCount is non-empty', () => {
      wrapper.vm.selectedEmployeeCount = [
        { employee_count_range: '1-50', employee_count_range_id: 'id-1' },
      ];
      expect(wrapper.vm.areSecondaryFiltersDirty()).toBe(true);
    });

    it('returns true when selectedStatusValues is not "Published"', () => {
      wrapper.vm.selectedStatusValues = 'Withdrawn';
      expect(wrapper.vm.areSecondaryFiltersDirty()).toBe(true);
    });

    it('returns false when selectedStatusValues is "Published"', () => {
      wrapper.vm.selectedStatusValues = 'Published';
      expect(wrapper.vm.areSecondaryFiltersDirty()).toBe(false);
    });

    it('returns true when selectedAdminActions is set', () => {
      wrapper.vm.selectedAdminActions = 'YEAR';
      expect(wrapper.vm.areSecondaryFiltersDirty()).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // clear
  // ---------------------------------------------------------------------------

  describe('clear', () => {
    it('resets all filter values to their defaults', () => {
      wrapper.vm.searchText = 'Acme';
      wrapper.vm.submissionDateRange = [new Date()];
      wrapper.vm.selectedNaicsCodes = [{ naics_code: '11' }];
      wrapper.vm.selectedReportYear = 2023;
      wrapper.vm.selectedLockedValues = 'Locked';
      wrapper.vm.selectedEmployeeCount = [{ employee_count_range_id: 'id-1' }];
      wrapper.vm.selectedStatusValues = 'Withdrawn';
      wrapper.vm.selectedAdminActions = 'YEAR';

      wrapper.vm.clear();

      expect(wrapper.vm.searchText).toBeUndefined();
      expect(wrapper.vm.submissionDateRange).toBeUndefined();
      expect(wrapper.vm.selectedNaicsCodes).toStrictEqual([]);
      expect(wrapper.vm.selectedReportYear).toBeUndefined();
      expect(wrapper.vm.selectedLockedValues).toBeUndefined();
      expect(wrapper.vm.selectedEmployeeCount).toStrictEqual([]);
      expect(wrapper.vm.selectedStatusValues).toBe('Published');
      expect(wrapper.vm.selectedAdminActions).toBeUndefined();
    });

    it('calls reportSearchStore.reset()', () => {
      const store = useReportSearchStore(pinia);
      wrapper.vm.clear();
      expect(store.reset).toHaveBeenCalledOnce();
    });
  });

  // ---------------------------------------------------------------------------
  // reset
  // ---------------------------------------------------------------------------

  describe('reset', () => {
    it('clears all filters', () => {
      wrapper.vm.selectedReportYear = 2023;
      wrapper.vm.reset();
      expect(wrapper.vm.selectedReportYear).toBeUndefined();
    });

    it('hides secondary filters', async () => {
      wrapper.vm.areSecondaryFiltersVisible = true;
      wrapper.vm.reset();
      await flushPromises();
      expect(wrapper.find('.secondary-filters').exists()).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // searchReports
  // ---------------------------------------------------------------------------

  describe('searchReports', () => {
    it('calls reportSearchStore.searchReports with the current filters', async () => {
      const store = useReportSearchStore(pinia);
      wrapper.vm.searchText = 'Acme';
      await wrapper.vm.searchReports();
      expect(store.searchReports).toHaveBeenCalledWith({
        filter: expect.arrayContaining([
          expect.objectContaining({ key: 'company_name', value: 'Acme' }),
        ]),
      });
    });
  });

  // ---------------------------------------------------------------------------
  // getReportSearchFilters
  // ---------------------------------------------------------------------------

  describe('getReportSearchFilters', () => {
    describe('after clear is called', () => {
      it('produces the default filters array', () => {
        wrapper.vm.clear();
        expect(wrapper.vm.getReportSearchFilters()).toStrictEqual([
          { key: 'report_status', operation: 'eq', value: 'Published' },
        ]);
      });
    });

    describe('when searchText is set', () => {
      it('includes a company_name like filter', () => {
        wrapper.vm.clear();
        wrapper.vm.searchText = 'Acme Corp';
        const filters = wrapper.vm.getReportSearchFilters();
        const match = filters.find((f) => f.key === 'company_name');
        expect(match).toMatchObject({
          operation: 'like',
          value: 'Acme Corp',
        });
      });
    });

    describe('when searchText is empty', () => {
      it('does not include a company_name filter', () => {
        wrapper.vm.clear();
        const filters = wrapper.vm.getReportSearchFilters();
        expect(filters.find((f) => f.key === 'company_name')).toBeUndefined();
      });
    });

    describe('when two NAICS codes are selected', () => {
      it('produces an in filter with both codes', () => {
        wrapper.vm.clear();
        wrapper.vm.selectedNaicsCodes = [
          { naics_code: 'mock-naics-1', naics_label: 'mock-naics-label-1' },
          { naics_code: 'mock-naics-2', naics_label: 'mock-naics-label-2' },
        ];
        const filters = wrapper.vm.getReportSearchFilters();
        const naicsFilters = filters.filter((f) => f.key === 'naics_code');
        expect(naicsFilters).toHaveLength(1);
        expect(naicsFilters[0]).toMatchObject({
          operation: 'in',
          value: ['mock-naics-1', 'mock-naics-2'],
        });
      });
    });

    describe('when no NAICS codes are selected', () => {
      it('does not include a naics_code filter', () => {
        wrapper.vm.clear();
        const filters = wrapper.vm.getReportSearchFilters();
        expect(filters.find((f) => f.key === 'naics_code')).toBeUndefined();
      });
    });

    describe('when a submission date range is specified', () => {
      it('produces a create_date between filter with two ISO timestamps', () => {
        wrapper.vm.clear();
        wrapper.vm.submissionDateRange = [
          new Date('2024-04-17T00:00:00Z'),
          new Date('2024-05-17T00:00:00Z'),
        ];
        const filters = wrapper.vm.getReportSearchFilters();
        const dateFilters = filters.filter((f) => f.key === 'create_date');
        expect(dateFilters).toHaveLength(1);
        expect(dateFilters[0].operation).toBe('between');
        expect(dateFilters[0].value).toHaveLength(2);
      });

      it('sets the start timestamp to start of day (00:00:00)', () => {
        wrapper.vm.clear();
        wrapper.vm.submissionDateRange = [
          new Date('2024-04-17T12:30:00Z'),
          new Date('2024-05-17T12:30:00Z'),
        ];
        const [startTs] = wrapper.vm
          .getReportSearchFilters()
          .find((f) => f.key === 'create_date').value;
        expect(startTs).toMatch(/T00:00:00/);
      });

      it('sets the end timestamp to end of day (23:59:59)', () => {
        wrapper.vm.clear();
        wrapper.vm.submissionDateRange = [
          new Date('2024-04-17T12:30:00Z'),
          new Date('2024-05-17T12:30:00Z'),
        ];
        const [, endTs] = wrapper.vm
          .getReportSearchFilters()
          .find((f) => f.key === 'create_date').value;
        expect(endTs).toMatch(/T23:59:59/);
      });
    });

    describe('when the report year is specified', () => {
      it('produces a reporting_year eq filter', () => {
        wrapper.vm.clear();
        wrapper.vm.selectedReportYear = 2024;
        const filters = wrapper.vm.getReportSearchFilters();
        const yearFilters = filters.filter((f) => f.key === 'reporting_year');
        expect(yearFilters).toHaveLength(1);
        expect(yearFilters[0]).toMatchObject({ operation: 'eq', value: 2024 });
      });
    });

    describe('when two employee count ranges are selected', () => {
      it('produces an in filter with both IDs', () => {
        wrapper.vm.clear();
        wrapper.vm.selectedEmployeeCount = [
          { employee_count_range: '1-50', employee_count_range_id: 'id-1' },
          { employee_count_range: '51-100', employee_count_range_id: 'id-2' },
        ];
        const filters = wrapper.vm.getReportSearchFilters();
        const empFilters = filters.filter(
          (f) => f.key === 'employee_count_range_id',
        );
        expect(empFilters).toHaveLength(1);
        expect(empFilters[0]).toMatchObject({
          operation: 'in',
          value: ['id-1', 'id-2'],
        });
      });
    });

    describe('when the Locked filter is set to Locked', () => {
      it('produces an is_unlocked eq false filter', () => {
        wrapper.vm.clear();
        wrapper.vm.selectedLockedValues = 'Locked';
        const filters = wrapper.vm.getReportSearchFilters();
        const lockedFilters = filters.filter((f) => f.key === 'is_unlocked');
        expect(lockedFilters).toHaveLength(1);
        expect(lockedFilters[0]).toMatchObject({
          operation: 'eq',
          value: false,
        });
      });
    });

    describe('when the Locked filter is set to Unlocked', () => {
      it('produces an is_unlocked eq true filter', () => {
        wrapper.vm.clear();
        wrapper.vm.selectedLockedValues = 'Unlocked';
        const filters = wrapper.vm.getReportSearchFilters();
        const lockedFilters = filters.filter((f) => f.key === 'is_unlocked');
        expect(lockedFilters).toHaveLength(1);
        expect(lockedFilters[0]).toMatchObject({
          operation: 'eq',
          value: true,
        });
      });
    });

    describe('when the Status filter is set to Withdrawn', () => {
      it('produces a report_status eq Withdrawn filter', () => {
        wrapper.vm.clear();
        wrapper.vm.selectedStatusValues = 'Withdrawn';
        const filters = wrapper.vm.getReportSearchFilters();
        const statusFilters = filters.filter((f) => f.key === 'report_status');
        expect(statusFilters).toHaveLength(1);
        expect(statusFilters[0]).toMatchObject({
          operation: 'eq',
          value: 'Withdrawn',
        });
      });
    });

    describe('when the Status filter is set to null (All)', () => {
      it('does not include a report_status filter', () => {
        wrapper.vm.clear();
        wrapper.vm.selectedStatusValues = null;
        const filters = wrapper.vm.getReportSearchFilters();
        expect(filters.find((f) => f.key === 'report_status')).toBeUndefined();
      });
    });

    describe('when the Admin Actions filter is set', () => {
      it('produces an admin_modified_reason eq filter', () => {
        wrapper.vm.clear();
        wrapper.vm.selectedAdminActions = 'YEAR';
        const filters = wrapper.vm.getReportSearchFilters();
        const adminFilters = filters.filter(
          (f) => f.key === 'admin_modified_reason',
        );
        expect(adminFilters).toHaveLength(1);
        expect(adminFilters[0]).toMatchObject({
          operation: 'eq',
          value: 'YEAR',
        });
      });
    });

    describe('when no Admin Actions filter is set', () => {
      it('does not include an admin_modified_reason filter', () => {
        wrapper.vm.clear();
        const filters = wrapper.vm.getReportSearchFilters();
        expect(
          filters.find((f) => f.key === 'admin_modified_reason'),
        ).toBeUndefined();
      });
    });

    describe('when all filters are set simultaneously', () => {
      it('includes all expected filter keys', () => {
        wrapper.vm.searchText = 'Acme';
        wrapper.vm.submissionDateRange = [
          new Date('2024-01-01'),
          new Date('2024-12-31'),
        ];
        wrapper.vm.selectedNaicsCodes = [
          { naics_code: '11', naics_label: 'Agriculture' },
        ];
        wrapper.vm.selectedReportYear = 2024;
        wrapper.vm.selectedEmployeeCount = [
          { employee_count_range: '1-50', employee_count_range_id: 'id-1' },
        ];
        wrapper.vm.selectedLockedValues = 'Unlocked';
        wrapper.vm.selectedStatusValues = 'Published';
        wrapper.vm.selectedAdminActions = 'YEAR';

        const keys = wrapper.vm.getReportSearchFilters().map((f) => f.key);
        expect(keys).toEqual(
          expect.arrayContaining([
            'company_name',
            'create_date',
            'naics_code',
            'reporting_year',
            'employee_count_range_id',
            'is_unlocked',
            'report_status',
            'admin_modified_reason',
          ]),
        );
      });
    });
  });
});
