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
    const mockedDeleteDraftReports = jest.spyOn(
      schedulerService,
      'deleteDraftReports',
    );
    // set system time to cron execute time 12:15 AM
    var twelvefifteen = new Date();
    twelvefifteen.setHours(0);
    twelvefifteen.setMinutes(15);
    twelvefifteen.setSeconds(0);
    twelvefifteen.setMilliseconds(0);

    // expect twelvefifteen to be less than now
    expect(new Date().getTime() - twelvefifteen.getTime() > 0).toBe(true);

    // set system time to 12:15 AM
    jest.useFakeTimers().setSystemTime(twelvefifteen);

    await schedulerService.deleteDraftReports();
    expect(mockedDeleteDraftReports).toHaveBeenCalled();
  });
});
