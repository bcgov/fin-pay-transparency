export type EmployerMetrics = {
  num_employers_logged_on_to_date: number;
};

/* Get Employer - Filter */

export enum EmployerKeyEnum {
  Name = 'company_name',
  Year = 'create_year',
  Date = 'create_date',
}

export type EmployerFilterType = (
  | {
      key: EmployerKeyEnum.Name;
      value: string;
      operation: 'like';
    }
  | {
      key: EmployerKeyEnum.Year;
      value: number[];
      operation: 'in';
    }
  | {
      key: EmployerKeyEnum.Date;
      value: string[];
      operation: 'between';
    }
)[];

/* Get Employer - Sort */

export type EmployerSortType = {
  field: 'create_date' | 'company_name';
  order: 'asc' | 'desc';
}[];

/* Get Employer - Results*/

export type Employer = {
  company_id: string;
  company_name: string;
  create_date: Date;
};

export interface IEmployerSearchResult {
  employers: Employer[];
  total: number;
  totalPages: number;
  offset: number;
  limit: number;
}
