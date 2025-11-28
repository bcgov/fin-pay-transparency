export type EmployerMetrics = {
  num_employers_logged_on_to_date: number;
  num_employers_logged_on_this_year: number;
};

/* Get Employer - Filter */

export enum EmployerKeyEnum {
  Name = 'company_name',
  Year = 'create_year',
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
