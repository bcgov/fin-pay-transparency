import { ref, computed, watch, shallowRef } from 'vue';
import { LocalDate } from '@js-joda/core';
import {
  computeBounds,
  clampStartDate,
  yearRange,
  monthOptionsForYear,
} from './ReportingDateRange';

export interface UseReportingDateRangeOptions {
  initialReportYear?: number;
  initialStartDate?: LocalDate;
}

/**
 * Manages the 12-month reporting date range (start date + derived end date)
 * for a given reporting year: the allowed min/max bounds, the selectable
 * year/month field options, and keeping everything in sync when the user
 * edits any one field.
 */
export function useReportingDateRange(
  options: UseReportingDateRangeOptions = {},
) {
  const currentYear = LocalDate.now().year();

  const reportYear = ref<number>(options.initialReportYear ?? currentYear);

  // The single source of truth for the whole date range
  const startDate = shallowRef<LocalDate>(
    options.initialStartDate ?? LocalDate.now().minusYears(1).withDayOfMonth(1),
  );

  // Allowed ranges are derived from reportYear
  const bounds = computed(() => computeBounds(reportYear.value));
  const minStartDate = computed(() => bounds.value.minStartDate);
  const minEndDate = computed(() => bounds.value.minEndDate);
  const maxStartDate = computed(() => bounds.value.maxStartDate);
  const maxEndDate = computed(() => bounds.value.maxEndDate);

  /**
   * Safely set the startDate. If `date` is outside the allowable range,
   * it is moved inside it.
   */
  function setStartDate(date: LocalDate | undefined) {
    if (!date || date.equals(startDate.value)) return;
    startDate.value = clampStartDate(date, bounds.value);
  }

  // Displayed field values are computed from startDate

  const startYear = computed({
    get: () => startDate.value.year(),
    set: (year: number) =>
      setStartDate(LocalDate.of(year, startMonth.value, 1)),
  });

  const startMonth = computed({
    get: () => startDate.value.monthValue(),
    set: (month: number) =>
      setStartDate(LocalDate.of(startYear.value, month, 1)),
  });

  const endYear = computed({
    get: () => startDate.value.plusMonths(11).year(),
    set: (year: number) =>
      setStartDate(LocalDate.of(year, endMonth.value, 1).minusMonths(11)),
  });

  const endMonth = computed({
    get: () => startDate.value.plusMonths(11).monthValue(),
    set: (month: number) =>
      setStartDate(LocalDate.of(endYear.value, month, 1).minusMonths(11)),
  });

  // Dropdown/combobox options are derived from bounds + current fields

  const startYearList = computed(() =>
    yearRange(minStartDate.value.year(), maxStartDate.value.year()),
  );

  const endYearList = computed(() =>
    yearRange(minEndDate.value.year(), maxEndDate.value.year()),
  );

  const startMonthList = computed(() =>
    monthOptionsForYear(startYear.value, {
      min: minStartDate.value,
      max: maxStartDate.value,
    }),
  );

  const endMonthList = computed(() =>
    monthOptionsForYear(endYear.value, {
      min: minEndDate.value,
      max: maxEndDate.value,
    }),
  );

  // When reportYear changes and startDate would fall outside the new
  // allowed range, shift it by one year and re-clamp if still out of range.
  watch(reportYear, () => {
    if (startDate.value.isBefore(minStartDate.value)) {
      setStartDate(startDate.value.plusYears(1));
    } else if (startDate.value.isAfter(maxStartDate.value)) {
      setStartDate(startDate.value.minusYears(1));
    }
  });

  return {
    // state
    reportYear,
    startDate,
    // writable fields
    startYear,
    startMonth,
    endYear,
    endMonth,
    // field options
    startYearList,
    startMonthList,
    endYearList,
    endMonthList,
    // bounds (exposed for tests / consumers)
    minStartDate,
    minEndDate,
    maxStartDate,
    maxEndDate,
    // imperative setter (used by the component's model-sync layer)
    setStartDate,
  };
}
