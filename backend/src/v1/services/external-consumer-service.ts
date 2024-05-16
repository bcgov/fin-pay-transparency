import prismaReadOnlyReplica from '../prisma/prisma-client-readonly-replica';
import {
  LocalDate,
  LocalDateTime,
  ZoneId,
  convert,
  nativeJs,
} from '@js-joda/core';
import groupBy from 'lodash/groupBy';
import keys from 'lodash/keys';
import { PayTransparencyUserError } from './file-upload-service';
import { Prisma } from '@prisma/client';

type RawQueryResult = {
  report_id: string;
  report_change_id: string;
  company_id: string;
  user_id: string;
  user_comment: any;
  employee_count_range_id: string;
  naics_code: string;
  report_start_date: string;
  report_end_date: string;
  create_date: string;
  update_date: string;
  create_user: string;
  update_user: string;
  report_status: string;
  revision: number;
  data_constraints: any;
  is_unlocked: boolean;
  reporting_year: number;
  report_unlock_date: any;
  naics_label: string;
  effective_date: string;
  expiry_date: any;
  naics_year: string;
  employee_count_range: string;
  calculation_code_id: string;
  value: string;
  is_suppressed: boolean;
  calculation_code: string;
  company_name: string;
  province: string;
  bceid_business_guid: string;
  city: string;
  country: string;
  postal_code: string;
  address_line1: string;
  address_line2: string;
};

const buildReport = (data: RawQueryResult[]) => {
  const first = data[0];

  return {
    report_id: first.report_id,
    company_id: first.company_id,
    naics_code: first.naics_code,
    create_date: first.create_date,
    update_date: first.update_date,
    data_constraints: first.data_constraints,
    user_comment: first.user_comment,
    revision: first.revision,
    report_start_date: first.report_start_date,
    report_end_date: first.report_end_date,
    report_status: first.report_status,
    reporting_year: first.reporting_year,
    company_name: first.company_name,
    company_province: first.province,
    company_bceid_business_guid: first.bceid_business_guid,
    company_city: first.city,
    company_country: first.country,
    company_postal_code: first.postal_code,
    company_address_line1: first.address_line1,
    company_address_line2: first.address_line2,
    employee_count_range: first.employee_count_range,
    naics_code_label: first.naics_label,
    calculated_data: data.map((item) => ({
      value: item.value,
      is_suppressed: item.is_suppressed,
      calculation_code: item.calculation_code,
    })),
  };
};

const DEFAULT_PAGE_SIZE = 50;

const externalConsumerService = {
  /**
   * This function returns a list of objects with pagination details to support the analytics team.
   * this endpoint should not return more than 1000 records at a time.
   * if limit is greater than 1000, it will default to 1000.
   * calling this endpoint with no limit will default to 1000.
   * calling this endpoint with no offset will default to 0.
   * calling this endpoint with no start date will default to 30 days ago.
   * calling this endpoint with no end date will default to today.
   * consumer is responsible for making the api call in a loop to get all the records.
   * @param startDate from when records needs to be fetched
   * @param endDate till when records needs to be fetched
   * @param offset the starting point of the records , to support pagination
   * @param limit the number of records to be fetched
   */
  async exportDataWithPagination(
    startDate?: string,
    endDate?: string,
    offset?: number,
    limit?: number,
  ) {
    let startDt = LocalDateTime.now(ZoneId.UTC)
      .minusMonths(1)
      .withHour(0)
      .withMinute(0);
    let endDt = LocalDateTime.now(ZoneId.UTC)
      .plusDays(1)
      .withHour(0)
      .withMinute(0);
    if (!limit || limit <= 0 || limit > DEFAULT_PAGE_SIZE) {
      limit = DEFAULT_PAGE_SIZE;
    }
    if (!offset || offset < 0) {
      offset = 0;
    }
    try {
      if (startDate) {
        const date = convert(LocalDate.parse(startDate)).toDate();
        startDt = LocalDateTime.from(nativeJs(date, ZoneId.UTC))
          .withHour(0)
          .withMinute(0);
      }

      if (endDate) {
        const date = convert(LocalDate.parse(endDate)).toDate();
        endDt = LocalDateTime.from(nativeJs(date, ZoneId.UTC))
          .withHour(23)
          .withMinute(59);
      }
    } catch (error) {
      throw new PayTransparencyUserError(
        'Failed to parse dates. Please use date format YYYY-MM-dd',
      );
    }

    if (startDt.isAfter(endDt)) {
      throw new PayTransparencyUserError(
        'Start date must be before the end date.',
      );
    }

    /**
     * 1) Create a union of the pay_transparency_report and report_history table as reports
     * 2) Sort by update date, then by revision (have to sort by revision too because reports in version PT1.2 all share the same update date )
     * 3) Create a union of the pay_transparency_calculated_data and calculated_data_history as calculated
     * 4) Paginate the reports
     * 5) Join reports and calculated_data based on report_change_id
     */
    const getReportsQuery = Prisma.sql`select *
     from ((select report.report_id,
                  report.report_id as report_change_id,
                  report.company_id,
                  report.user_id,
                  report.user_comment,
                  report.employee_count_range_id,
                  report.naics_code,
                  report.report_start_date,
                  report.report_end_date,
                  report.create_date,
                  report.update_date,
                  report.create_user,
                  report.update_user,
                  report.report_status,
                  report.revision,
                  report.data_constraints,
                  report.is_unlocked,
                  report.reporting_year,
                  report.report_unlock_date,
                  naics_code.naics_label,
                  company.company_id,
                  company.company_name,
                  company.bceid_business_guid,
                  company.address_line1,
                  company.address_line2,
                  company.city,
                  company.province,
                  company.country,
                  company.postal_code,
                  employee_count_range.employee_count_range
           from pay_transparency_report as report
		       left join naics_code as naics_code on naics_code.naics_code = report.naics_code
           left join pay_transparency_company as company on company.company_id = report.company_id
           left join employee_count_range as employee_count_range on employee_count_range.employee_count_range_id = report.employee_count_range_id
           where report_status = 'Published'
               and (report.update_date >= ${convert(startDt).toDate()}
                    and report.update_date < ${convert(endDt).toDate()})
           union
               (select report.report_id,
                       report.report_history_id as report_change_id,
                       report.company_id,
                       report.user_id,
                       report.user_comment,
                       report.employee_count_range_id,
                       report.naics_code,
                       report.report_start_date,
                       report.report_end_date,
                       report.create_date,
                       report.update_date,
                       report.create_user,
                       report.update_user,
                       report.report_status,
                       report.revision,
                       report.data_constraints,
                       report.is_unlocked,
                       report.reporting_year,
                       report.report_unlock_date,
                       naics_code.naics_label,
                       company.company_id,
                       company.company_name,
                       company.bceid_business_guid,
                       company.address_line1,
                       company.address_line2,
                       company.city,
                       company.province,
                       company.country,
                       company.postal_code,
                       employee_count_range.employee_count_range
                from report_history as report
				        left join naics_code as naics_code on naics_code.naics_code = report.naics_code
                left join pay_transparency_company as company on company.company_id = report.company_id
                left join employee_count_range as employee_count_range on employee_count_range.employee_count_range_id = report.employee_count_range_id
                where report_status = 'Published'
                    and (report.update_date >= ${convert(startDt).toDate()}
                         and report.update_date < ${convert(endDt).toDate()})))
      order by update_date, revision
      offset ${offset}
      limit ${limit}) as reports

left join
    (select data.report_id as calculated_data_report_id,
            data.calculation_code_id,
            data.value,
            data.is_suppressed,
            code.calculation_code
     from
         (select data.report_id,
                 data.calculation_code_id,
                 data.value,
                 data.is_suppressed
          from pay_transparency_calculated_data as data where data.update_date >= ${convert(startDt).toDate()}
                         and data.update_date < ${convert(endDt).toDate()}
          union
              (select data.report_history_id as report_id,
                      data.calculation_code_id,
                      data.value,
                      data.is_suppressed
               from calculated_data_history as data where data.update_date >= ${convert(startDt).toDate()}
                         and data.update_date < ${convert(endDt).toDate()})) as data
     left join calculation_code as code on code.calculation_code_id = data.calculation_code_id) as calculated_data on calculated_data.calculated_data_report_id = reports.report_change_id`;

    // const results = await prismaReadOnlyReplica
    //   .$replica()
    //   .$queryRaw<RawQueryResult[]>(getReportsQuery);
    // const uniqueReports: Record<string, RawQueryResult[]> = groupBy(
    //   results,
    //   (x) => x.report_change_id,
    // );

    // const uniqueReportIds: string[] = keys(uniqueReports);

    // const reports = uniqueReportIds.map((id_rev) => {
    //   const data = uniqueReports[id_rev];
    //   return buildReport(data);
    // });

    return {
      page: offset / limit,
      pageSize: limit,
      records: await prismaReadOnlyReplica.reports.findMany({
        include: {
          calculated_data: {
            select: {
              value: true,
              is_suppressed: true,
              calculation_code: true
            }
          }
        },
        take: limit,
        skip: offset
      }),
    };
  },
};
export { externalConsumerService };
