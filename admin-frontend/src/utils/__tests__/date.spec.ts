import { DateTimeFormatter, ZonedDateTime, ZoneId } from '@js-joda/core';
import { Locale } from '@js-joda/locale_en';
import { describe, expect, it } from 'vitest';
import {
  formatDate,
  formatIsoDateTimeAsLocalDate,
  formatIsoDateTimeAsLocalTime,
} from '../date';

describe('formatDate', () => {
  describe('given a datetime string in ISO 8601 format and UTC', () => {
    it('converts into a string in the local timezone', () => {
      const inDatetimeStr = '2024-09-05T18:15:00.000Z';
      const inFormatter = DateTimeFormatter.ISO_DATE_TIME;
      const outFormatter = DateTimeFormatter.ISO_INSTANT;

      const expectedDate = ZonedDateTime.parse(
        inDatetimeStr,
        inFormatter,
      ).withZoneSameInstant(ZoneId.systemDefault());

      const outDatetimeStr = formatDate(
        inDatetimeStr,
        inFormatter,
        outFormatter,
      );

      expect(outDatetimeStr).toBe(outFormatter.format(expectedDate));
    });
  });
});

describe('formatIsoDateTimeAsLocalDate', () => {
  it('returns a date string in the expected format', () => {
    const inDatetimeStr = '2024-09-05T18:15:00.000Z';
    const inFormatter = DateTimeFormatter.ISO_DATE_TIME;
    const outFormatter = DateTimeFormatter.ofPattern('MMM d, yyyy').withLocale(
      Locale.CANADA,
    );

    const expectedDate = ZonedDateTime.parse(
      inDatetimeStr,
      inFormatter,
    ).withZoneSameInstant(ZoneId.systemDefault());

    const outDatetimeStr = formatIsoDateTimeAsLocalDate(inDatetimeStr);

    expect(outDatetimeStr).toBe(outFormatter.format(expectedDate));
  });
});

describe('formatIsoDateTimeAsLocalTime', () => {
  it('returns a time string in the expected format', () => {
    const inDatetimeStr = '2024-09-05T18:15:00.000Z';
    const inFormatter = DateTimeFormatter.ISO_DATE_TIME;
    const outFormatter = DateTimeFormatter.ofPattern('h:mm a').withLocale(
      Locale.CANADA,
    );

    const expectedDate = ZonedDateTime.parse(
      inDatetimeStr,
      inFormatter,
    ).withZoneSameInstant(ZoneId.systemDefault());

    const outDatetimeStr = formatIsoDateTimeAsLocalTime(inDatetimeStr);

    expect(outDatetimeStr).toBe(outFormatter.format(expectedDate));
  });
});
