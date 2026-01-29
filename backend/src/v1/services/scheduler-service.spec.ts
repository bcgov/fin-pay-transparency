import {
  LocalDate,
  LocalDateTime,
  ZoneId,
  ZonedDateTime,
  convert,
  nativeJs,
} from '@js-joda/core';
import {
  Prisma,
  admin_user,
  announcement,
  pay_transparency_report,
} from '@prisma/client';
import prisma from '../prisma/prisma-client.js';
import { enumReportStatus } from './report-service.js';
import { schedulerService } from './scheduler-service.js';
import { faker } from '@faker-js/faker';

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
  report_unlock_date: null,
  admin_modified_date: new Date(),
  admin_modified_reason: null,
  admin_user_id: '',
  admin_last_access_date: null,
};

const mockCalculatedDatasInDB = [
  { ...mockDraftReport },
  { ...mockDraftReport, report_id: '456769' },
];

const mock_generateHtmlEmail = jest.fn();
const mock_sendEmailWithRetry = jest.fn();

jest.mock('../../external/services/ches/ches', () => ({
  __esModule: true,
  default: {
    generateHtmlEmail: (...args) => mock_generateHtmlEmail(...args),
    sendEmailWithRetry: (...args) => mock_sendEmailWithRetry(...args),
  },
}));

const mockGetExpiringAnnouncements = jest.fn();
jest.mock('./announcements-service', () => ({
  announcementService: {
    getExpiringAnnouncements: () => mockGetExpiringAnnouncements(),
  },
}));

const mockGetUsers = jest.fn();
const mockInitSSO = jest.fn();
jest.mock('./sso-service', () => ({
  SSO: {
    init: () => mockInitSSO(),
  },
}));

const mockConfigGet = jest.fn();
jest.mock('../../config/config', () => ({
  config: {
    get: (...args) => mockConfigGet(...args),
  },
}));

const mockDBAdminUsers: Partial<admin_user>[] = Array(3).fill({
  email: faker.internet.email(),
});

const mockDBAnnouncement: Partial<announcement>[] = [
  {
    title: faker.lorem.sentence(),
    expires_on: faker.date.soon(),
  },
  {
    title: 'test title',
    expires_on: convert(
      ZonedDateTime.parse('2020-05-10T08:50:00.000Z'),
    ).toDate(),
  },
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

    //verify that it was called with one day previous
    const delete_date = LocalDate.now(ZoneId.UTC).minusDays(1).toString();
    const call = (prisma.pay_transparency_report.deleteMany as jest.Mock).mock
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

describe('sendAnnouncementExpiringEmails', () => {
  beforeEach(async () => {
    mockInitSSO.mockResolvedValue({
      getUsers: () => mockGetUsers(),
    });
    mockGetUsers.mockResolvedValue(mockDBAdminUsers);
    mockGetExpiringAnnouncements.mockResolvedValue(mockDBAnnouncement);
    mockConfigGet.mockImplementation((key: string) => {
      const settings = {
        'server:openshiftEnv': 'DEV',
        'server:schedulerTimeZone': 'America/Vancouver',
        'ches:enabled': true,
        'server:enableEmailExpiringAnnouncements': true,
      };
      return settings[key];
    });
  });
  it('sends emails', async () => {
    await schedulerService.sendAnnouncementExpiringEmails();
    expect(mock_sendEmailWithRetry).toHaveBeenCalledTimes(2); //2 expired announcements, 2 emails
    // verify details of email
    expect(mock_generateHtmlEmail.mock.lastCall[0]).toContain('[DEV]');
    expect(mock_generateHtmlEmail.mock.lastCall[1]).toHaveLength(3);
    expect(mock_generateHtmlEmail.mock.lastCall[3]).toContain('test title');
    expect(mock_generateHtmlEmail.mock.lastCall[3]).toContain(
      '2020-05-10 at 1:50 a.m.',
    );
  });
  it("doesn't do anything if the feature is disabled in the settings", async () => {
    mockConfigGet.mockImplementation((key: string) => {
      const settings = {
        'server:enableEmailExpiringAnnouncements': false,
      };

      return settings[key];
    });
    await schedulerService.sendAnnouncementExpiringEmails();
    expect(mock_sendEmailWithRetry).toHaveBeenCalledTimes(0); //2 expired announcements, 2 emails
  });

  it('Prod should not contain prefix', async () => {
    mockConfigGet.mockImplementation((key: string) => {
      const settings = {
        'server:openshiftEnv': 'PROD',
        'server:schedulerTimeZone': 'America/Vancouver',
        'ches:enabled': true,
        'server:enableEmailExpiringAnnouncements': true,
      };
      return settings[key];
    });
    await schedulerService.sendAnnouncementExpiringEmails();
    expect(mock_sendEmailWithRetry).toHaveBeenCalledTimes(2); //2 expired announcements, 2 emails
    // verify details of email
    expect(mock_generateHtmlEmail.mock.lastCall[0]).not.toContain('[');
  });
});
