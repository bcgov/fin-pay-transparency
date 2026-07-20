// reportingDateRange.core.ts
//
// Pure, framework-free logic for the 12-month reporting date range.
// No Vue imports, no reactivity — every function is a plain
// input -> output mapping, so it can be unit tested directly with
// plain LocalDate values and no component/composable scaffolding.

import { LocalDate, TemporalAdjusters } from '@js-joda/core';

export interface MonthOption {
  title: string;
  value: number;
}

export interface MonthSelectOption extends MonthOption {
  props: { disabled: boolean };
}

export const MONTHS: readonly MonthOption[] = [
  { title: 'Jan.', value: 1 },
  { title: 'Feb.', value: 2 },
  { title: 'Mar.', value: 3 },
  { title: 'Apr.', value: 4 },
  { title: 'May', value: 5 },
  { title: 'June', value: 6 },
  { title: 'July', value: 7 },
  { title: 'Aug.', value: 8 },
  { title: 'Sept.', value: 9 },
  { title: 'Oct.', value: 10 },
  { title: 'Nov.', value: 11 },
  { title: 'Dec.', value: 12 },
];

export interface DateRangeBounds {
  minStartDate: LocalDate;
  minEndDate: LocalDate;
  maxStartDate: LocalDate;
  maxEndDate: LocalDate;
}

/**
 * Computes the allowable start/end bounds for a given reporting year.
 * @param reportYear
 * @param lastDateAllowed Last selectable date (Default: 'today')
 * @returns
 */
export function computeBounds(
  reportYear: number,
  lastDateAllowed: LocalDate = LocalDate.now(),
): DateRangeBounds {
  const minStartDate = lastDateAllowed
    .withYear(reportYear)
    .minusYears(1)
    .with(TemporalAdjusters.firstDayOfYear());

  const minEndDate = minStartDate
    .plusMonths(11)
    .with(TemporalAdjusters.lastDayOfMonth());

  const lastPossible = LocalDate.of(reportYear, 12, 31);
  const maxEndDate = lastPossible.isBefore(lastDateAllowed)
    ? lastPossible
    : lastDateAllowed
        .withYear(reportYear)
        .minusMonths(1)
        .with(TemporalAdjusters.lastDayOfMonth());

  const maxStartDate = maxEndDate
    .minusMonths(11)
    .with(TemporalAdjusters.firstDayOfMonth());

  return { minStartDate, minEndDate, maxStartDate, maxEndDate };
}

/** Clamps `date` into [bounds.minStartDate, bounds.maxStartDate]. */
export function clampStartDate(
  date: LocalDate,
  bounds: Pick<DateRangeBounds, 'minStartDate' | 'maxStartDate'>,
): LocalDate {
  if (date.isBefore(bounds.minStartDate)) return bounds.minStartDate;
  if (date.isAfter(bounds.maxStartDate)) return bounds.maxStartDate;
  return date;
}

/** Inclusive list of years from `fromYear` to `toYear`. */
export function yearRange(fromYear: number, toYear: number): number[] {
  return Array.from({ length: toYear - fromYear + 1 }, (_, i) => fromYear + i);
}

/**
 * Builds the month dropdown options for a given year, disabling any
 * month whose adjusted day falls outside [min, max].
 * (Doesn't handle cases where `year` is outside of `range`)
 * @param year The year to get the months within the range
 * @param range A range of dates, stretching multiple years
 */
export function monthOptionsForYear(
  year: number,
  range: { min: LocalDate; max: LocalDate },
): MonthSelectOption[] {
  const date = LocalDate.of(year, 1, 1);
  const lastdate = LocalDate.of(year, 12, 31);

  const firstValidMonth = date.isAfter(range.min)
    ? date.monthValue()
    : range.min.monthValue();
  const lastValidMonth = lastdate.isBefore(range.max)
    ? lastdate.monthValue()
    : range.max.monthValue();

  return MONTHS.map((month) => {
    const disabled =
      month.value < firstValidMonth || month.value > lastValidMonth;
    return { ...month, props: { disabled } };
  });
}
