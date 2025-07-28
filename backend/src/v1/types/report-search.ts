import * as z from 'zod';

export type FilterValueType = string[] | null | undefined | boolean;

export type FilterKeyType =
  | 'create_date'
  | 'update_date'
  | 'naics_code'
  | 'reporting_year'
  | 'is_unlocked'
  | 'report_status'
  | 'employee_count_range_id'
  | 'company_name'
  | 'admin_last_access_date';

export type SubmissonDateFilter = {
  key: 'create_date';
  operation: 'between';
  value: string[];
};

export type UpdateDateFilter = {
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

export type ReportStatusFilter = {
  key: 'report_status';
  operation: 'eq';
  value: string;
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
  | UpdateDateFilter
  | NaicsCodeFilter
  | ReportingYearFilter
  | IsUnlockedFilter
  | ReportStatusFilter
  | EmployeeCountRangeFilter
  | CompanyFilter
  | AdminLastAccessDateFilter
)[];

export type SortFieldType =
  | 'create_date'
  | 'update_date'
  | 'naics_code'
  | 'employee_count_range_id'
  | 'company_name'
  | 'admin_last_access_date';

type SortDirection = 'asc' | 'desc';

export type SubmissionDateSort = {
  create_date: SortDirection;
};
export type UpdateDateSort = {
  update_date: SortDirection;
};
export type NaicsCodeSort = {
  naics_code: SortDirection;
};
export type EmployeeCountRangeSort = {
  employee_count_range_id: SortDirection;
};
export type AdminLastAccessDateSort = {
  admin_last_access_date: SortDirection;
};

export type CompanySort = {
  company_name: SortDirection;
};

export type ReportSortType = (
  | SubmissionDateSort
  | UpdateDateSort
  | NaicsCodeSort
  | EmployeeCountRangeSort
  | CompanySort
  | AdminLastAccessDateSort
)[];

export const RELATION_MAPPER: {
  [key in SortFieldType]?: string;
} = {
  company_name: 'pay_transparency_company',
};

const FILTER_OPERATION_SCHEMA: {
  [key in FilterKeyType]: z.ZodString | z.ZodEnum<any>;
} = {
  create_date: z.enum(['between'], {
    message: 'Only "between" operation is allowed',
  }),
  update_date: z.enum(['between'], {
    message: 'Only "between" operation is allowed',
  }),
  naics_code: z.enum(['in', 'notin'], {
    message: 'Only "in" or "notin" operation is allowed',
  }),
  employee_count_range_id: z.enum(['in', 'notin'], {
    message: 'Only "in" or "notin" operation is allowed',
  }),
  reporting_year: z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte'], {
    message:
      'Only "eq" or "neq" or "gt" or "gte" or "lt" or "lte" operation is allowed',
  }),
  is_unlocked: z.enum(['eq'], { message: 'Only "eq" operation is allowed' }),
  report_status: z.enum(['eq'], { message: 'Only "eq" operation is allowed' }),
  company_name: z.enum(['like'], {
    message: 'Only "like" operation is allowed',
  }),
  admin_last_access_date: z.enum(['not'], {
    message: 'Only "not" operation is allowed',
  }),
};

const FILTER_VALUE_SCHEMA: { [key in FilterKeyType]: any } = {
  create_date: z.array(z.string()).optional(),
  update_date: z.array(z.string()).optional(),
  naics_code: z.array(z.string()).optional(),
  employee_count_range_id: z.array(z.string()).optional(),
  reporting_year: z.number().optional(),
  is_unlocked: z.boolean().optional(),
  report_status: z.enum(['Published', 'Withdrawn']).optional(),
  company_name: z.string().optional(),
  admin_last_access_date: z.null(),
};

export const FilterValidationSchema = z.array(
  z
    .object({
      key: z.enum(
        [
          'create_date',
          'update_date',
          'naics_code',
          'reporting_year',
          'is_unlocked',
          'report_status',
          'employee_count_range_id',
          'company_name',
          'admin_last_access_date',
        ],
        {
          required_error: 'Missing or invalid filter key',
          message:
            'key must be one of the following values: create_date, update_date, naics_code, reporting_year, is_unlocked, report_status, employee_count_range_id',
        },
      ),
      operation: z.string({
        required_error: 'Missing operation',
      }),
      value: z.any().optional(),
    })
    .refine(
      (data) => {
        return FILTER_OPERATION_SCHEMA[data.key].safeParse(data.operation)
          .success;
      },
      {
        message: 'Missing or invalid operation',
        path: ['operation'],
      },
    )
    .refine(
      (data) => {
        return FILTER_VALUE_SCHEMA[data.key].safeParse(data.value).success;
      },
      {
        message: 'Invalid or missing filter value',
        path: ['value'],
      },
    ),
);
