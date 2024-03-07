import prisma from '../prisma/prisma-client';
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

afterEach(() => {
  jest.clearAllMocks();
});

describe('deleteDraftReports', () => {
  afterEach(() => {
    jest.useRealTimers();
  });
  it('cron job executes once at configured cron time', async () => {
    // set system time to cron time: 12:15 AM
    var now = new Date();
    now.setHours(0);
    now.setMinutes(15);
    now.setSeconds(0);
    now.setMilliseconds(0);

    jest.useFakeTimers().setSystemTime(now);

    expect(schedulerService.deleteDraftReports).toHaveBeenCalledTimes(1);
  });
});
