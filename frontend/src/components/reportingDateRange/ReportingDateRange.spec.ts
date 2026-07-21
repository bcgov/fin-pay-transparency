// reportingDateRange.spec.ts
// Example test suite (vitest syntax) demonstrating why the split pays off:
// the core module needs no Vue at all, and the composable needs no
// parent/model mocking to be exercised.

import { describe, it, expect } from 'vitest';
import { LocalDate } from '@js-joda/core';
import {
  computeBounds,
  clampStartDate,
  yearRange,
  monthOptionsForYear,
} from './ReportingDateRange';

describe('ReportingDateRangeService', () => {
  const today = LocalDate.of(2026, 7, 17); // fixed "now" — no clock flakiness

  it('computes min/max start & end dates for all report years', async () => {
    // prettier-ignore
    /**
     * Testing data -
     * If the current date is `date` and the reporting year selected is `year`,
     * then the values of various ranges should be as indicated.
     */
    const data = [
      // middle of year
      { date: '2026-07-13', year: 2026, minStart: '2025-01-01', maxStart: '2025-07-01', minEnd: '2025-12-31', maxEnd: '2026-06-30' },
      { date: '2026-07-13', year: 2025, minStart: '2024-01-01', maxStart: '2025-01-01', minEnd: '2024-12-31', maxEnd: '2025-12-31' },
      // beginning of year
      { date: '2026-01-01', year: 2026, minStart: '2025-01-01', maxStart: '2025-01-01', minEnd: '2025-12-31', maxEnd: '2025-12-31' },
      { date: '2026-01-01', year: 2025, minStart: '2024-01-01', maxStart: '2025-01-01', minEnd: '2024-12-31', maxEnd: '2025-12-31' },
      //end of year
      { date: '2026-12-31', year: 2026, minStart: '2025-01-01', maxStart: '2025-12-01', minEnd: '2025-12-31', maxEnd: '2026-11-30' },
      { date: '2026-12-31', year: 2025, minStart: '2024-01-01', maxStart: '2025-01-01', minEnd: '2024-12-31', maxEnd: '2025-12-31' },
    ];

    for (const sample of data) {
      const result = computeBounds(sample.year, LocalDate.parse(sample.date));
      expect(
        result.minStartDate.toString(),
        `date: ${sample.date}, year: ${sample.year}`,
      ).toBe(sample.minStart);
      expect(
        result.maxStartDate.toString(),
        `date: ${sample.date}, year: ${sample.year}`,
      ).toBe(sample.maxStart);
      expect(
        result.minEndDate.toString(),
        `date: ${sample.date}, year: ${sample.year}`,
      ).toBe(sample.minEnd);
      expect(
        result.maxEndDate.toString(),
        `date: ${sample.date}, year: ${sample.year}`,
      ).toBe(sample.maxEnd);
    }
  });

  it('clamps a start date that is before the minimum', () => {
    const bounds = computeBounds(2026, today);
    const clamped = clampStartDate(LocalDate.of(2000, 1, 1), bounds);
    expect(clamped).toEqual(bounds.minStartDate);
  });

  it('clamps a start date that is after the maximum', () => {
    const bounds = computeBounds(2026, today);
    const clamped = clampStartDate(LocalDate.of(2050, 1, 1), bounds);
    expect(clamped).toEqual(bounds.maxStartDate);
  });

  it('does not clamp a start date that is after the maximum', () => {
    const bounds = computeBounds(2026, today);
    const clamped = clampStartDate(LocalDate.of(2025, 2, 1), bounds);
    expect(clamped).toEqual(LocalDate.of(2025, 2, 1));
  });

  it('builds an inclusive year range', () => {
    expect(yearRange(2023, 2026)).toEqual([2023, 2024, 2025, 2026]);
  });

  it('shows at least one year', () => {
    expect(yearRange(2026, 2026)).toEqual([2026]);
  });

  it('enables correct end-period values when minimum start date is chosen', async () => {
    // prettier-ignore
    const data = [
      //1st of month to end of month
      {year:2026, range:{min:LocalDate.of(2025,1,1), max:LocalDate.of(2026,6,30)}, months:[1,2,3,4,5,6]}, // year is at end of range
      {year:2026, range:{min:LocalDate.of(2026,5,1), max:LocalDate.of(2027,12,31)}, months:[5,6,7,8,9,10,11,12]}, // year is at beginning of range
      {year:2026, range:{min:LocalDate.of(2026,5,1), max:LocalDate.of(2026,9,30)}, months:[5,6,7,8,9]},  // whoel range is within year
      {year:2026, range:{min:LocalDate.of(2025,5,1), max:LocalDate.of(2027,12,31)}, months:[1,2,3,4,5,6,7,8,9,10,11,12]},  // whole year is within range
      //1st of month to 1st of month
      {year:2026, range:{min:LocalDate.of(2025,1,1), max:LocalDate.of(2026,6,1)}, months:[1,2,3,4,5,6]},
      {year:2026, range:{min:LocalDate.of(2026,5,1), max:LocalDate.of(2027,12,1)}, months:[5,6,7,8,9,10,11,12]},
      {year:2026, range:{min:LocalDate.of(2026,5,1), max:LocalDate.of(2026,9,1)}, months:[5,6,7,8,9]},
      {year:2026, range:{min:LocalDate.of(2025,5,1), max:LocalDate.of(2027,12,1)}, months:[1,2,3,4,5,6,7,8,9,10,11,12]},
      //end of month to end of month
      {year:2026, range:{min:LocalDate.of(2025,1,31), max:LocalDate.of(2026,6,30)}, months:[1,2,3,4,5,6]},
      {year:2026, range:{min:LocalDate.of(2026,5,31), max:LocalDate.of(2027,12,31)}, months:[5,6,7,8,9,10,11,12]},
      {year:2026, range:{min:LocalDate.of(2026,5,31), max:LocalDate.of(2026,9,30)}, months:[5,6,7,8,9]},
      {year:2026, range:{min:LocalDate.of(2025,5,31), max:LocalDate.of(2027,12,31)}, months:[1,2,3,4,5,6,7,8,9,10,11,12]},
      //end of month to first of month
      {year:2026, range:{min:LocalDate.of(2025,1,31), max:LocalDate.of(2026,6,1)}, months:[1,2,3,4,5,6]},
      {year:2026, range:{min:LocalDate.of(2026,5,31), max:LocalDate.of(2027,12,1)}, months:[5,6,7,8,9,10,11,12]},
      {year:2026, range:{min:LocalDate.of(2026,5,31), max:LocalDate.of(2026,9,1)}, months:[5,6,7,8,9]},
      {year:2026, range:{min:LocalDate.of(2025,5,31), max:LocalDate.of(2027,12,1)}, months:[1,2,3,4,5,6,7,8,9,10,11,12]},
    ];

    for (const sample of data) {
      const result = monthOptionsForYear(sample.year, sample.range);

      const enabled = result
        .filter((m) => !m.props.disabled)
        .map((m) => m.value);

      expect(enabled).toEqual(sample.months);
    }
  });
});
