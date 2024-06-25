import { DateTimeFormatter, ZoneId, ZonedDateTime } from '@js-joda/core';
import prisma from '../prisma/prisma-client';
import prismaReadOnlyReplica from '../prisma/prisma-client-readonly-replica';
import { errorService } from './error-service';
import { SubmissionError } from './file-upload-service';
import { ValidationError, RowError } from './validate-service';

jest.mock('../prisma/prisma-client', () => {
  return {
    user_error: {
      createMany: jest.fn(),
    },
  };
});

jest.mock('../prisma/prisma-client-readonly-replica', () => {
  return {
    pay_transparency_user: {
      findFirst: jest.fn(),
    },
    pay_transparency_company: {
      findFirst: jest.fn(),
    },
    user_error: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };
});

const mockCompanyInDB = {
  company_id: 'cf175a22-217f-4f3f-b2a4-8b43dd19a9a2', // random guid
};
const mockUserInDB = {
  user_id: '727dc60a-95a3-4a83-9b6b-1fb0e1de7cc3', // random guid
};

const mockUserInfo = {
  _json: {
    bceid_user_guid: '727dc60a-95a3-4a83-9b6b-1fb0e1de7cc3', // random guid
    bceid_business_guid: 'cf175a22-217f-4f3f-b2a4-8b43dd19a9a2', // random guid
  },
};

const mockValidationError = new ValidationError(
  //bodyErrors
  [
    'Minimum allowed start date is 2024.',
    'Start date and end date must always be 12 months apart.',
  ],
  //rowErrors
  [
    new RowError(13, [
      'Hours Worked must not contain data when Special Salary contains data.',
      'Ordinary Pay must not be blank or 0 when Hours Worked contains data.',
    ]),
    new RowError(1142, [
      "Invalid Gender Code 'D' (expected one of: M, W, F, X, U).",
    ]),
  ],
  //GeneralErrors
  ['Something went wrong.'],
);

const mockArray = [
  'Minimum allowed start date is 2024.',
  'Start date and end date must always be 12 months apart.',
  'Hours Worked must not contain data when Special Salary contains data.',
  'Ordinary Pay must not be blank or 0 when Hours Worked contains data.',
  "Invalid Gender Code 'D' (expected one of: M, W, F, X, U).",
  'Something went wrong.',
];

afterEach(() => {
  jest.clearAllMocks();
});

describe('storeError', () => {
  (
    prismaReadOnlyReplica.pay_transparency_company.findFirst as jest.Mock
  ).mockResolvedValue(mockCompanyInDB);
  (
    prismaReadOnlyReplica.pay_transparency_user.findFirst as jest.Mock
  ).mockResolvedValue(mockUserInDB);

  it('stores SubmissionError with ValidationError', async () => {
    await errorService.storeError(
      mockUserInfo,
      new SubmissionError(mockValidationError),
    );
    const createMany = (prisma.user_error.createMany as jest.Mock).mock
      .calls[0][0];
    expect(createMany.data.map((x) => x.error)).toStrictEqual(mockArray);
  });

  it('stores SubmissionError with string', async () => {
    const error = 'Something went wrong';
    const subError = new SubmissionError(error);
    await errorService.storeError(mockUserInfo, subError);
    const createMany = (prisma.user_error.createMany as jest.Mock).mock
      .calls[0][0];
    expect(createMany.data.map((x) => x.error)).toStrictEqual([error]);
  });

  it('stores Error', async () => {
    const error = 'test error';
    const errorObj = new Error(error);
    await errorService.storeError(mockUserInfo, errorObj);
    const createMany = (prisma.user_error.createMany as jest.Mock).mock
      .calls[0][0];
    expect(createMany.data.map((x) => x.error)).toStrictEqual([error]);
  });

  it('does not store anything if there are no errors', async () => {
    await errorService.storeError(
      mockUserInfo,
      new SubmissionError(new ValidationError([], [], [])),
    );

    expect(prisma.user_error.createMany).toHaveBeenCalledTimes(0);
  });
});

describe('retrieveErrors', () => {
  it('runs with default values', async () => {
    await errorService.retrieveErrors();
    expect(prismaReadOnlyReplica.user_error.findMany).toHaveBeenCalled();
  });

  it('limit is calculated correctly', async () => {
    await errorService.retrieveErrors(undefined, undefined, '5', '20');
    expect(prismaReadOnlyReplica.user_error.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 100,
      }),
    );
  });

  it('accepts ISO-8601 dates', async () => {
    await errorService.retrieveErrors(
      '2024-05-20T00:00-07:00',
      '2024-05-20T23:59-07:00',
    );
    expect(prismaReadOnlyReplica.user_error.findMany).toHaveBeenCalled();
  });

  it('accepts ISO-8601 UTC dates', async () => {
    await errorService.retrieveErrors('2024-05-20T00:00Z', '2024-05-20T23:59Z');
    expect(prismaReadOnlyReplica.user_error.findMany).toHaveBeenCalled();
  });

  it('accepts yyyy-MM-dd HH:mm dates', async () => {
    await errorService.retrieveErrors('2024-05-20 00:00', '2024-05-20 23:59');
    expect(prismaReadOnlyReplica.user_error.findMany).toHaveBeenCalled();
  });

  it('limit: throws error if parameter is not valid', async () => {
    await expect(
      errorService.retrieveErrors(undefined, undefined, undefined, '0'),
    ).rejects.toThrow();
    await expect(
      errorService.retrieveErrors(undefined, undefined, undefined, '-1'),
    ).rejects.toThrow();
    await expect(
      errorService.retrieveErrors(undefined, undefined, undefined, '1001'),
    ).rejects.toThrow();
    await expect(
      errorService.retrieveErrors(undefined, undefined, undefined, 'abc'),
    ).rejects.toThrow();
  });

  it('page: throws error if parameter is not valid', async () => {
    await expect(
      errorService.retrieveErrors(undefined, undefined, '-1'),
    ).rejects.toThrow();
    await expect(
      errorService.retrieveErrors(undefined, undefined, 'abc'),
    ).rejects.toThrow();
  });

  it('end date: throws error if parameter is not valid', async () => {
    await expect(
      errorService.retrieveErrors(undefined, 'hello'),
    ).rejects.toThrow();
  });

  it('end date: throws error if parameter is in the future', async () => {
    await expect(
      errorService.retrieveErrors(
        undefined,
        ZonedDateTime.now(ZoneId.UTC)
          .plusMinutes(1)
          .format(DateTimeFormatter.ISO_DATE_TIME),
      ),
    ).rejects.toThrow();
  });

  it('start date: throws error if parameter is not valid', async () => {
    await expect(errorService.retrieveErrors('hello')).rejects.toThrow();
  });

  it('start date: throws error if parameter is after end date', async () => {
    await expect(
      errorService.retrieveErrors(
        ZonedDateTime.now(ZoneId.UTC)
          .plusDays(1)
          .format(DateTimeFormatter.ISO_DATE_TIME),
        ZonedDateTime.now(ZoneId.UTC).format(DateTimeFormatter.ISO_DATE_TIME),
      ),
    ).rejects.toThrow();
  });
});
