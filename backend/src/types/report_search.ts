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

export type ReportFilterType = (SubmissonDateFilter | NaicsCodeFilter | ReportingYearFilter | IsUnlockedFilter | EmployeeCountRangeFilter)[]

export type SortFieldType = 'create_date' | 'naics_code' | 'employee_count_range_id';

type SortType = {
    [key in SortFieldType]: 'asc' | 'desc';
}

export type ReportSortType = SortType[];