export interface IConfigValue {}
export interface IReportSearchResult {
  reports: any[];
  total: number;
}
export interface IReportSearchUpdateParams {
  page: number;
  itemsPerPage: number;
  sortBy: IReportSearchSort;
}
export interface IReportSearchParams {
  page?: number;
  itemsPerPage?: number;
  filter?: ReportFilterType;
  sort?: IReportSearchSort;
}
export type IReportSearchSort = any[] | undefined;

export enum ReportKeys {
  UPDATE_DATE = 'update_date',
  COMPANY_NAME = 'pay_transparency_company.company_name',
  NAICS_CODE = 'naics_code',
  EMPLOYEE_COUNT = 'employee_count_range.employee_count_range',
  REPORTING_YEAR = 'reporting_year',
}
export enum BackendReportSortKeys {
  COMPANY_NAME = 'company_name',
  UPDATE_DATE = 'update_date',
  NAICS_CODE = 'naics_code',
  EMPLOYEE_COUNT = 'employee_count_range_id',
}

//Mapping of properties from a "Report" object to the corrsponding sort
//key expected by the backend when sorting
export const SORT_KEY_MAPPING = {};
SORT_KEY_MAPPING[ReportKeys.COMPANY_NAME] = BackendReportSortKeys.COMPANY_NAME;
SORT_KEY_MAPPING[ReportKeys.UPDATE_DATE] = BackendReportSortKeys.UPDATE_DATE;
SORT_KEY_MAPPING[ReportKeys.NAICS_CODE] = BackendReportSortKeys.NAICS_CODE;
SORT_KEY_MAPPING[ReportKeys.EMPLOYEE_COUNT] =
  BackendReportSortKeys.EMPLOYEE_COUNT;

// Report search filter
//-----------------------------------------------------------------------------

export type SubmissonDateFilter = {
  key: 'update_date';
  operation: 'between';
  value: string[];
};

export type ArrayFilter = {
  key: string;
  operation: 'in' | 'notin';
  value: string[];
};

export type NaicsCodeFilter = ArrayFilter & {
  key: 'naics_code';
};

export type EmployeeCountRangeFilter = ArrayFilter & {
  key: 'employee_count_range_id';
};

export type ReportingYearFilter = {
  key: 'reporting_year';
  operation: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte';
  value: number;
};

export type IsUnlockedFilter = {
  key: 'is_unlocked';
  operation: 'eq';
  value: boolean;
};

export type CompanyFilter = {
  key: 'company_name';
  operation: 'like';
  value: string;
};

export type ReportFilterType = (
  | SubmissonDateFilter
  | NaicsCodeFilter
  | ReportingYearFilter
  | IsUnlockedFilter
  | EmployeeCountRangeFilter
  | CompanyFilter
)[];

export type User = {
  id: string;
  displayName: string;
  roles: string[];
  effectiveRole: string;
};

export type AddUserInput = {
  firstName: string;
  email: string;
  role: string;
};
