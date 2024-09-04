import { DateTimeFormatter, ZonedDateTime, ZoneId } from '@js-joda/core';
import { Locale } from '@js-joda/locale_en';

const DEFAULT_DATE_FORMAT = DateTimeFormatter.ofPattern(
  'MMM d, yyyy',
).withLocale(Locale.CANADA);

const DEFAULT_TIME_FORMAT = DateTimeFormatter.ofPattern('h:mm a').withLocale(
  Locale.CANADA,
);

/*
Converts a datetime string of one format into another format.
Always converts the timezone of the input into the local timezone.
The incoming and outgoing formats can be specified with Joda
DateTimeFormatter objects passed as parameters. By default, assumes the 
incoming datetime string is in ISO 8601 format.
*/
export function formatDate(
  inDateStr: string,
  inFormatter = DateTimeFormatter.ISO_DATE_TIME,
  outFormatter = DEFAULT_DATE_FORMAT,
) {
  const date = ZonedDateTime.parse(inDateStr, inFormatter);
  const localTz = ZoneId.systemDefault();
  const dateInLocalTz = date.withZoneSameInstant(localTz);
  return outFormatter.format(dateInLocalTz);
}

/*
Converts an ISO 8601 datetime string into a human-friendly date string 
in the local tz (e.g. "Sep. 5, 2024")
*/
export function formatIsoDateTimeAsLocalDate(inDateStr: string) {
  return formatDate(
    inDateStr,
    DateTimeFormatter.ISO_DATE_TIME,
    DEFAULT_DATE_FORMAT,
  );
}

/*
Converts an ISO 8601 datetime string into a human-friendly time string 
in the local tz (e.g. "9:45 a.m.")
*/
export function formatIsoDateTimeAsLocalTime(inDateStr: string) {
  return formatDate(
    inDateStr,
    DateTimeFormatter.ISO_DATE_TIME,
    DEFAULT_TIME_FORMAT,
  );
}
