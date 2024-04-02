import waitFor from 'wait-for-expect';
import { LocalDateTime, ZoneId, convert } from '@js-joda/core';
import createPrismaMock from 'prisma-mock';
import { Prisma, PrismaClient } from '@prisma/client';

let prismaClient: PrismaClient<
  Prisma.PrismaClientOptions,
  'query' | 'info' | 'warn' | 'error'
>;

const mock_prismaClient = () => prismaClient;

jest.mock('../v1/prisma/prisma-client', () => ({
  __esModule: true,
  ...jest.requireActual('../v1/prisma/prisma-client'),
  default: mock_prismaClient(),
}));

jest.mock('cron', () => ({
  CronJob: class MockCron {
    constructor(
      public expression: string,
      public cb: Function,
    ) {}
    async start() {
      return this.cb();
    }
  },
}));

jest.mock('../config', () => ({
  config: {
    get: (key: string) => {
      const settings = {
        'server:reportEditDurationInDays': 30,
        'server:reportUnlockDurationInDays': 2
      }
      
      return settings[key];
    }
  }
}))

const mock_tryLock = jest.fn();
const mock_unlock = jest.fn();
jest.mock('advisory-lock', () => ({
  ...jest.requireActual('advisory-lock'),
  default: () => {
    return () => ({
      tryLock: () => mock_tryLock(),
    });
  },
}));

describe('lock-report-scheduler', () => {
  beforeEach(async () => {
    prismaClient = createPrismaMock(
      {
        pay_transparency_report: [
          // Cannot be locked
          {
            report_id: '1',
            is_unlocked: true,
            report_status: 'Published',
            create_date: convert(LocalDateTime.now(ZoneId.UTC)).toDate(),
            report_unlock_date: null,
          },
          // Can be locked, older than default editable period (30 days)
          {
            report_id: '2',
            is_unlocked: true,
            report_status: 'Published',
            create_date: convert(
              LocalDateTime.now(ZoneId.UTC).minusDays(40),
            ).toDate(),
            report_unlock_date: null,
          },
          // Cannot be locked, before report_unlock_date
          {
            report_id: '3',
            is_unlocked: true,
            report_status: 'Published',
            create_date: convert(
              LocalDateTime.now(ZoneId.UTC).minusDays(40),
            ).toDate(),
            report_unlock_date: convert(
              LocalDateTime.now(ZoneId.UTC)).toDate(),
          },
          // Can be locked, past report_unlock_date
          {
            report_id: '4',
            is_unlocked: true,
            report_status: 'Published',
            create_date: convert(
              LocalDateTime.now(ZoneId.UTC).minusDays(40),
            ).toDate(),
            report_unlock_date: convert(
              LocalDateTime.now(ZoneId.UTC).minusDays(3),
            ).toDate(),
          },
          // Cannot be locked, not published
          {
            report_id: '5',
            is_unlocked: true,
            report_status: 'Draft',
            create_date: convert(
              LocalDateTime.now(ZoneId.UTC).minusDays(40),
            ).toDate(),
            report_unlock_date: convert(
              LocalDateTime.now(ZoneId.UTC).plusDays(3),
            ).toDate(),
          },
        ],
      },
      Prisma.dmmf.datamodel,
    );
  });

  it('should lock all lockable reports', async () => {
    mock_tryLock.mockReturnValue(mock_unlock);
    await require('./lock-reports-scheduler');
    await waitFor(async () => {
      expect(mock_tryLock).toHaveBeenCalledTimes(1);
      expect(mock_unlock).toHaveBeenCalledTimes(1);
      const reports = await prismaClient.pay_transparency_report.findMany({
        select: { report_id: true, is_unlocked: true },
      });
      expect(reports.find(r => r.report_id === '1').is_unlocked).toBeTruthy();
      expect(reports.find(r => r.report_id === '2').is_unlocked).toBeFalsy();
      expect(reports.find(r => r.report_id === '3').is_unlocked).toBeTruthy();
      expect(reports.find(r => r.report_id === '4').is_unlocked).toBeFalsy();
      expect(reports.find(r => r.report_id === '5').is_unlocked).toBeTruthy();
    });
  });
});
