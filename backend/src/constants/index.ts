import { DateTimeFormatter } from '@js-joda/core';
import { Locale } from '@js-joda/locale_en';

export const MISSING_COMPANY_DETAILS_ERROR = 'Missing company details';
export const MISSING_TOKENS_ERROR = 'Token or refresh token cannot be found';
export const MISSING_BUSINESS_GUID_ERROR = 'Business GUID not found';
export const REPORT_NOT_FOUND_ERROR = 'Report not found';
export const REPORT_STATUS_NOT_VALID_ERROR = 'Report status not valid';
export const BAD_REQUEST =
  'Bad request, the information provided is not i=enough or invalid';

export const KEYCLOAK_IDP_HINT_AZUREIDIR = 'azureidir';
export const OIDC_AZUREIDIR_STRATEGY_NAME = KEYCLOAK_IDP_HINT_AZUREIDIR;
export const OIDC_AZUREIDIR_CALLBACK_NAME = `callback_${KEYCLOAK_IDP_HINT_AZUREIDIR}`;
export const OIDC_AZUREIDIR_SCOPE = KEYCLOAK_IDP_HINT_AZUREIDIR;

export const JSON_REPORT_DATE_FORMAT = DateTimeFormatter.ofPattern(
  'YYYY-MM-dd',
).withLocale(Locale.ENGLISH);

// Define how report dates should be formatted for different
export const DISPLAY_REPORT_DATE_FORMAT = DateTimeFormatter.ofPattern(
  'MMMM d, YYYY',
).withLocale(Locale.ENGLISH);
export const FILENAME_REPORT_DATE_FORMAT = DateTimeFormatter.ofPattern(
  'YYYY-MM',
).withLocale(Locale.ENGLISH);
