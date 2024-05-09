import prismaReadOnlyReplica from '../prisma/prisma-client-readonly-replica';
import {
  LocalDate,
  LocalDateTime,
  ZoneId,
  convert,
  nativeJs,
} from '@js-joda/core';
import pick from 'lodash/pick';
import flatten from 'lodash/flatten';
import { PayTransparencyUserError } from './file-upload-service';

const denormalizeCompany = (company) => {
  return {
    company_name: company.company_name,
    company_province: company.province,
    company_bceid_business_guid: company.bceid_business_guid,
    company_city: company.city,
    company_country: company.country,
    company_postal_code: company.postal_code,
    company_address_line1: company.address_line1,
    company_address_line2: company.address_line2,
  };
};

const denormalizeReport = (
  report,
  getNaicsCode: (report) => { naics_code: string; naics_label: string },
  getCalculatedData: (report) => {
    value: string;
    is_suppressed: string;
    calculation_code: any;
  }[],
) => {
  return {
    ...pick(report, [
      'report_id',
      'company_id',
      'naics_code',
      'create_date',
      'update_date',
      'data_constraints',
      'user_comment',
      'revision',
      'report_start_date',
      'report_end_date',
      'report_status',
      'reporting_year',
    ]),
    ...denormalizeCompany(report.pay_transparency_company),
    employee_count_range: report.employee_count_range.employee_count_range,
    naics_code: getNaicsCode(report).naics_code,
    naics_code_label: getNaicsCode(report).naics_label,
    calculated_data: getCalculatedData(report).map((data) => ({
      value: data.value,
      is_suppressed: data.is_suppressed,
      calculation_code: data.calculation_code.calculation_code,
    })),
  };
};

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
    if (limit > 1000 || !limit || limit <= 0) {
      limit = 1000;
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

    const results = await prismaReadOnlyReplica
      .$replica()
      .pay_transparency_report.findMany({
        where: {
          update_date: {
            gte: convert(startDt).toDate(),
            lte: convert(endDt).toDate(),
          },
          report_status: 'Published',
        },
        include: {
          naics_code_pay_transparency_report_naics_codeTonaics_code: true,
          employee_count_range: true,
          pay_transparency_calculated_data: {
            include: {
              calculation_code: true,
            },
          },
          pay_transparency_company: true,
          report_history: {
            include: {
              naics_code_report_history_naics_codeTonaics_code: true,
              employee_count_range: true,
              calculated_data_history: {
                include: {
                  calculation_code: true,
                },
              },
              pay_transparency_company: true,
            },
            where: {
              update_date: {
                gte: convert(startDt).toDate(),
                lte: convert(endDt).toDate(),
              },
            },
          },
        },
        skip: offset,
        take: limit,
      });

    return {
      page: offset,
      pageSize: limit,
      records: [
        ...results.map((report) => {
          return {
            ...denormalizeReport(
              report,
              (r) =>
                r.naics_code_pay_transparency_report_naics_codeTonaics_code,
              (r) => r.pay_transparency_calculated_data,
            ),
          };
        }),
        ...flatten(results.map((r) => r.report_history)).map((report) => {
          return {
            ...denormalizeReport(
              report,
              (r) => r.naics_code_report_history_naics_codeTonaics_code,
              (r) => r.calculated_data_history,
            ),
          };
        }),
      ],
    };
  },
};
export { externalConsumerService };
