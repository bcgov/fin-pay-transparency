export type Report = {
  report_id: string;
  naics_code: string;
  report_start_date: string;
  report_end_date: string;
  report_status: string;
  create_date: string;
  update_date: string;
  reporting_year: string;
  is_unlocked: boolean;
  admin_last_access_date: string;
  employee_count_range: {
    employee_count_range_id: string;
    employee_count_range: string;
  };
  pay_transparency_company: {
    company_id: string;
    company_name: string;
  };
};

export interface IReportSearchResult {
  reports: Report[];
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
  CREATE_DATE = 'create_date',
  UPDATE_DATE = 'update_date',
  COMPANY_NAME = 'pay_transparency_company.company_name',
  NAICS_CODE = 'naics_code',
  EMPLOYEE_COUNT = 'employee_count_range.employee_count_range',
  REPORTING_YEAR = 'reporting_year',
}
export enum BackendReportSortKeys {
  COMPANY_NAME = 'company_name',
  CREATE_DATE = 'create_date',
  UPDATE_DATE = 'update_date',
  NAICS_CODE = 'naics_code',
  EMPLOYEE_COUNT = 'employee_count_range_id',
}

//Mapping of properties from a "Report" object to the corrsponding sort
//key expected by the backend when sorting
export const SORT_KEY_MAPPING = {};
SORT_KEY_MAPPING[ReportKeys.COMPANY_NAME] = BackendReportSortKeys.COMPANY_NAME;
SORT_KEY_MAPPING[ReportKeys.CREATE_DATE] = BackendReportSortKeys.CREATE_DATE;
SORT_KEY_MAPPING[ReportKeys.UPDATE_DATE] = BackendReportSortKeys.UPDATE_DATE;
SORT_KEY_MAPPING[ReportKeys.NAICS_CODE] = BackendReportSortKeys.NAICS_CODE;
SORT_KEY_MAPPING[ReportKeys.EMPLOYEE_COUNT] =
  BackendReportSortKeys.EMPLOYEE_COUNT;

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

export type AdminLastAccessDateFilter = {
  key: 'admin_last_access_date';
  operation: 'not';
  value: null;
};

export type ReportFilterType = (
  | SubmissonDateFilter
  | NaicsCodeFilter
  | ReportingYearFilter
  | IsUnlockedFilter
  | EmployeeCountRangeFilter
  | CompanyFilter
  | AdminLastAccessDateFilter
)[];

export type ReportMetrics = {
  report_metrics: [
    {
      reporting_year: number;
      num_published_reports: number;
    },
  ];
};

export type ReportAdminActionHistory = [
  {
    report_history_id: string;
    is_unlocked: boolean;
    admin_modified_date: string;
    admin_user: {
      display_name: string;
    };
  },
];
