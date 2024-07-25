import { DateTimeFormatter, LocalDate } from '@js-joda/core';
import { Locale } from '@js-joda/locale_en';

const DEFAULT_DISPLAY_FORMAT = DateTimeFormatter.ofPattern(
  'MMM dd, yyyy',
).withLocale(Locale.CANADA);

/*
Converts a date/time string of one format into another format.
The incoming and outgoing formats can be specified with Joda
DateTimeFormatter objects passed as parameters.
*/
export function formatDate(
  inDateStr: string,
  inFormatter = DateTimeFormatter.ISO_DATE_TIME,
  outFormatter = DEFAULT_DISPLAY_FORMAT,
) {
  const jodaLocalDate = LocalDate.parse(inDateStr, inFormatter);
  return outFormatter.format(jodaLocalDate);
}
