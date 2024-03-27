import {
  LocalDate,
  LocalDateTime,
  ZoneId,
  convert,
  nativeJs,
} from '@js-joda/core';
import { Prisma, pay_transparency_report } from '@prisma/client';
import prisma from '../prisma/prisma-client';
import { enumReportStatus } from './report-service';
import { schedulerService } from './scheduler-service';

jest.mock('./utils-service');
jest.mock('../prisma/prisma-client', () => {
  return {
    pay_transparency_report: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    pay_transparency_calculated_data: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation((callback) => callback(prisma)),
  };
});

const mockDraftReport: pay_transparency_report = {
  report_id: '456768',
  company_id: '255677',
  user_id: '1232344',
  user_comment: null,
  employee_count_range_id: '67856345',
  naics_code: '234234',
  report_start_date: convert(LocalDate.now(ZoneId.UTC)).toDate(),
  report_end_date: convert(LocalDate.now(ZoneId.UTC).plusYears(1)).toDate(),
  reporting_year: new Prisma.Decimal(2022),
  create_date: new Date(),
  update_date: new Date(),
  create_user: 'User',
  update_user: 'User',
  report_status: enumReportStatus.Draft,
  revision: new Prisma.Decimal(1),
  data_constraints: null,
  is_unlocked: true,
};

const mockCalculatedDatasInDB = [
  { ...mockDraftReport },
  { ...mockDraftReport, report_id: '456769' },
];

afterEach(() => {
  jest.clearAllMocks();
});

describe('deleteDraftReports', () => {
  it('cron job executes once at configured cron time', async () => {
    (prisma.pay_transparency_report.findMany as jest.Mock).mockResolvedValue(
      mockCalculatedDatasInDB,
    );
    await schedulerService.deleteDraftReports();

    expect(prisma.pay_transparency_report.findMany).toHaveBeenCalledTimes(1);

    //verify that it was called with one day previous
    const delete_date = LocalDate.now(ZoneId.UTC).minusDays(1).toString();
    const call = (prisma.pay_transparency_report.findMany as jest.Mock).mock
      .calls[0][0];
    const callDate = LocalDateTime.from(
      nativeJs(new Date(call.where.create_date.lte), ZoneId.UTC),
    )
      .toLocalDate()
      .toString();
    expect(callDate).toBe(delete_date);

    expect(
      prisma.pay_transparency_calculated_data.deleteMany,
    ).toHaveBeenCalledTimes(1);
    expect(prisma.pay_transparency_report.deleteMany).toHaveBeenCalledTimes(1);
  });
});
