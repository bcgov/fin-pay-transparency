export type FilterOperationType =
  | 'between'
  | 'like'
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'notin'
  | 'isnull';

export type FilterValueType = string[] | null | undefined | boolean;

export type FilterKeyType =
  | 'create_date'
  | 'naics_code'
  | 'year'
  | 'is_unlocked'
  | 'employee_count_range_id';

export type SubmissonDateFilter = {
  key: 'create_date';
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

export type SortFieldType =
  | 'create_date'
  | 'naics_code'
  | 'employee_count_range_id'
  | 'company_name';

type SortDirection = 'asc' | 'desc';

export type SubmissionDateSort = {
  create_date: SortDirection;
};
export type NaicsCodeSort = {
  naics_code: SortDirection;
};
export type EmployeeCountRangeSort = {
  employee_count_range_id: SortDirection;
};

export type CompanySort = {
  company_name: SortDirection;
};

export type ReportSortType = (
  | SubmissionDateSort
  | NaicsCodeSort
  | EmployeeCountRangeSort
  | CompanySort
)[];

export const RELATION_MAPPER: {
  [key in SortFieldType]?: string;
} = {
  company_name: 'pay_transparency_company',
};
