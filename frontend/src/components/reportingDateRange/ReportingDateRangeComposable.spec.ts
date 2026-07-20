import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { convert, LocalDate } from '@js-joda/core';
import { useReportingDateRange } from './ReportingDateRangeComposable';

/**
 * Mounts the composable inside a tiny host component so its watch()
 * calls run within a proper reactive/component context (avoids
 * "onScopeDispose called when there is no active effect scope" warnings
 * and gives us a real Vue update cycle to flush with nextTick()).
 */
function setupComposable() {
  let result!: ReturnType<typeof useReportingDateRange>;

  const wrapper = mount(
    defineComponent({
      setup() {
        result = useReportingDateRange();
        return () => h('div');
      },
    }),
  );

  return { wrapper, result };
}

describe('useReportingDateRange', () => {
  beforeEach(() => {
    // Set "now" to 2024-06-15 so every computed bound is deterministic.
    vi.useFakeTimers();
    vi.setSystemTime(convert(LocalDate.of(2024, 6, 15)).toDate());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('defaults reportYear to the current year', () => {
      const { result } = setupComposable();
      expect(result.reportYear.value).toBe(2024);
    });

    it('defaults startDate to the 1st of the month, one year ago', () => {
      const { result } = setupComposable();
      expect(result.startDate.value.equals(LocalDate.of(2023, 6, 1))).toBe(
        true,
      );
    });

    it('derives startYear/startMonth/endYear/endMonth from startDate', () => {
      const { result } = setupComposable();
      expect(result.startYear.value).toBe(2023);
      expect(result.startMonth.value).toBe(6);
      // start + 11 months = 2024-05
      expect(result.endYear.value).toBe(2024);
      expect(result.endMonth.value).toBe(5);
    });
  });

  describe('dropdown option lists', () => {
    it('builds startYearList and endYearList from the min/max bounds', () => {
      const { result } = setupComposable();
      expect(result.startYearList.value).toEqual([2023]);
      expect(result.endYearList.value).toEqual([2023, 2024]);
    });

    it('disables startMonthList entries outside the allowed range', async () => {
      const { result } = setupComposable();
      const enabled = result.startMonthList.value
        .filter((m) => !m.props.disabled)
        .map((m) => m.value);
      const disabled = result.startMonthList.value
        .filter((m) => m.props.disabled)
        .map((m) => m.value);

      expect(enabled).toEqual([1, 2, 3, 4, 5, 6]);
      expect(disabled).toEqual([7, 8, 9, 10, 11, 12]);
    });

    it('disables endMonthList entries outside the allowed range', () => {
      const { result } = setupComposable();
      const enabled = result.endMonthList.value
        .filter((m) => !m.props.disabled)
        .map((m) => m.value);
      const disabled = result.endMonthList.value
        .filter((m) => m.props.disabled)
        .map((m) => m.value);

      expect(enabled).toEqual([1, 2, 3, 4, 5]);
      expect(disabled).toEqual([6, 7, 8, 9, 10, 11, 12]);
    });

    it('enables correct end-period values when minimum start date is chosen', async () => {
      // prettier-ignore
      const data = [
        { date:'2026-07-13', year:2026, select: {startYear:2025, startMonth:1}, results: {endYear:2025, selectableMonths:[12]} }, // minimum start date
        { date:'2026-07-13', year:2026, select: {startYear:2025, startMonth:7}, results: {endYear:2026, selectableMonths:[1, 2, 3, 4, 5, 6]} }, // maximum start date
        { date:'2026-07-13', year:2026, select: {endYear:2025, endMonth:1}, results: {startYear:2025, selectableMonths:[1, 2, 3, 4, 5, 6, 7]} }, // minimum end date
        { date:'2026-07-13', year:2026, select: {endYear:2026, endMonth:7}, results: {startYear:2025, selectableMonths:[1, 2, 3, 4, 5, 6, 7]} }, // maximum end date
        { date:'2026-07-13', year:2025, select: {startYear:2024, startMonth:1}, results: {endYear:2024, selectableMonths:[12]} }, // minimum start date
        { date:'2026-07-13', year:2025, select: {startYear:2025, startMonth:1}, results: {endYear:2025, selectableMonths:[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]} }, // maximum start date
        { date:'2026-07-13', year:2025, select: {endYear:2024, endMonth:12}, results: {startYear:2024, selectableMonths:[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]} }, // minimum end date
        { date:'2026-07-13', year:2025, select: {endYear:2025, endMonth:12}, results: {startYear:2025, selectableMonths:[1]} }, // maximum end date
      ];

      for (const sample of data) {
        vi.setSystemTime(convert(LocalDate.parse(sample.date)).toDate());
        const { result } = setupComposable();
        result.reportYear.value = sample.year;
        await nextTick();
        if (sample.select.startYear && sample.select.startMonth) {
          result.startYear.value = sample.select.startYear;
          await nextTick();
          result.startMonth.value = sample.select.startMonth;
          await nextTick();

          const enabled = result.endMonthList.value
            .filter((m) => !m.props.disabled)
            .map((m) => m.value);

          expect(enabled).toEqual(sample.results.selectableMonths);
          expect(result.endYear.value).toEqual(sample.results.endYear);
        }
        if (sample.select.endYear && sample.select.endMonth) {
          result.endYear.value = sample.select.endYear;
          await nextTick();
          result.endMonth.value = sample.select.endMonth;
          await nextTick();

          const enabled = result.startMonthList.value
            .filter((m) => !m.props.disabled)
            .map((m) => m.value);

          expect(enabled).toEqual(sample.results.selectableMonths);
          expect(result.startYear.value).toEqual(sample.results.startYear);
        }
      }
    });
  });

  describe('writable computed setters', () => {
    it('setting startYear keeps the current startMonth', async () => {
      const { result } = setupComposable();
      result.startYear.value = 2023; // only valid year, but exercises the setter
      await nextTick();
      expect(result.startDate.value.equals(LocalDate.of(2023, 6, 1))).toBe(
        true,
      );
    });

    it('setting startMonth updates startDate to that month', async () => {
      const { result } = setupComposable();
      result.startMonth.value = 3;
      await nextTick();
      expect(result.startDate.value.equals(LocalDate.of(2023, 3, 1))).toBe(
        true,
      );
    });

    it('setting endMonth recomputes startDate 11 months earlier', async () => {
      const { result } = setupComposable();
      result.endMonth.value = 3; // March 2024 end -> April 2023 start
      await nextTick();
      expect(result.startDate.value.equals(LocalDate.of(2023, 4, 1))).toBe(
        true,
      );
    });

    it('clamps startYear below the minimum to minStartDate', async () => {
      const { result } = setupComposable();
      result.startYear.value = 1900;
      await nextTick();
      expect(result.startDate.value.equals(result.minStartDate.value)).toBe(
        true,
      );
    });

    it('clamps startYear above the maximum to maxStartDate', async () => {
      const { result } = setupComposable();
      result.startYear.value = 3000;
      await nextTick();
      expect(result.startDate.value.equals(result.maxStartDate.value)).toBe(
        true,
      );
    });
  });

  describe('reportYear watcher keeping startDate in range', () => {
    it('shifts startDate forward a year when it falls before the new minStartDate', async () => {
      const { result } = setupComposable();
      expect(result.startDate.value.equals(LocalDate.of(2023, 6, 1))).toBe(
        true,
      );

      result.reportYear.value = 2025;
      await nextTick();

      expect(result.startDate.value.equals(LocalDate.of(2024, 6, 1))).toBe(
        true,
      );
    });

    it('shifts startDate back a year when it falls after the new maxStartDate', async () => {
      const { result } = setupComposable();

      result.reportYear.value = 2023;
      await nextTick();

      expect(result.startDate.value.equals(LocalDate.of(2022, 6, 1))).toBe(
        true,
      );
    });
  });
});
