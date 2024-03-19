import prismaReadOnlyReplica from '../prisma/prisma-client-readonly-replica';
import { LocalDate, convert } from '@js-joda/core';
import pick from 'lodash/pick';
import { PayTransparencyUserError } from './file-upload-service';

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
    let startDt: LocalDate = LocalDate.now().minusMonths(1);
    let endDt: LocalDate = LocalDate.now();
    if (limit > 1000 || !limit || limit <= 0) {
      limit = 1000;
    }
    if (!offset || offset < 0) {
      offset = 0;
    }
    try {
      if (startDate) {
        startDt = LocalDate.parse(startDate);
      }

      if (endDate) {
        endDt = LocalDate.parse(endDate);
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

    const totalCount = await prismaReadOnlyReplica
      .$replica()
      .pay_transparency_report.count({
        where: {
          AND: [
            { create_date: { gte: convert(startDt).toDate() } },
            { create_date: { lte: convert(endDt).toDate() } },
            { report_status: 'Published' },
          ],
        },
      });

    const results = await prismaReadOnlyReplica
      .$replica()
      .pay_transparency_report.findMany({
        where: {
          AND: [
            { create_date: { gte: convert(startDt).toDate() } },
            { create_date: { lte: convert(endDt).toDate() } },
            { report_status: 'Published' },
          ],
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
        },
        skip: offset,
        take: limit,
      });

    return {
      totalRecords: totalCount,
      page: offset,
      pageSize: limit,
      records: results.map(
        ({
          naics_code_pay_transparency_report_naics_codeTonaics_code,
          pay_transparency_calculated_data,
          employee_count_range,
          pay_transparency_company,
          ...report
        }) => {
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
            ]),
            company_name: pay_transparency_company.company_name,
            company_province: pay_transparency_company.province,
            company_bceid_business_guid:
              pay_transparency_company.bceid_business_guid,
            company_city: pay_transparency_company.city,
            company_country: pay_transparency_company.country,
            company_postal_code: pay_transparency_company.postal_code,
            company_address_line1: pay_transparency_company.address_line1,
            company_address_line2: pay_transparency_company.address_line2,
            employee_count_range: employee_count_range.employee_count_range,
            naics_code:
              naics_code_pay_transparency_report_naics_codeTonaics_code.naics_code,
            naics_code_label:
              naics_code_pay_transparency_report_naics_codeTonaics_code.naics_label,
            calculated_data: pay_transparency_calculated_data.map((data) => ({
              value: data.value,
              is_suppressed: data.is_suppressed,
              calculation_code: data.calculation_code,
            })),
          };
        },
      ),
    };
  },
};
export { externalConsumerService };
