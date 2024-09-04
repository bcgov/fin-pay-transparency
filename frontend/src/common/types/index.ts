export interface IConfigValue {
  maxUploadFileSize: number;
  reportEditDurationInDays: number;
  reportingYearOptions: number[];
}

export interface IReport {
  report_id: string;
  report_start_date: string;
  report_end_date: string;
  reporting_year: number;
  create_date: string;
  update_date: string;
  is_unlocked: boolean;
  naics_code: string;
  report_status: string;
  employee_count_range_id: string;
}
