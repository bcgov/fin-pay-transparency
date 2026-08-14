import { beforeEach, describe, expect, it, vi } from 'vitest';
import prisma from '../prisma/__mocks__/prisma-client.js';
import {
  createOrUpdateReportUrlSafe,
  getHistoryForReport,
  reportUrlSchema,
} from './report-url-service.js';
import type {
  pay_transparency_report,
  pay_transparency_report_url,
  pay_transparency_user,
  report_url_history,
} from '../prisma/generated/client.js';

vi.mock('../prisma/prisma-client.js');

describe('report-url-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a new report URL when none exists yet', async () => {
    const reportId = '11111111-1111-1111-1111-111111111111';
    const businessGuid = 'business-guid';
    const userGuid = 'user-guid';
    const userId = 'user-id';
    const reportUrl = 'https://example.com/report';
    const createdRecord = {
      url_id: 'url-1',
      report_id: reportId,
      report_url: reportUrl,
      create_user_id: userId,
      update_user_id: userId,
      create_date: new Date('2024-01-01T00:00:00.000Z'),
      update_date: new Date('2024-01-01T00:00:00.000Z'),
    };

    prisma.pay_transparency_report.findFirst.mockResolvedValueOnce({
      report_id: reportId,
    } as pay_transparency_report);
    prisma.pay_transparency_report_url.findUnique.mockResolvedValueOnce(null);
    prisma.pay_transparency_user.findFirst.mockResolvedValueOnce({
      user_id: userId,
    } as pay_transparency_user);
    prisma.pay_transparency_report_url.create.mockResolvedValueOnce(
      createdRecord,
    );

    const result = await createOrUpdateReportUrlSafe(
      reportId,
      reportUrl,
      businessGuid,
      userGuid,
    );

    expect(result).toEqual(createdRecord);
    expect(prisma.pay_transparency_report_url.create).toHaveBeenCalledWith({
      data: {
        create_user_id: userId,
        update_user_id: userId,
        report_id: reportId,
        report_url: reportUrl,
      },
    });
    expect(prisma.report_url_history.create).not.toHaveBeenCalled();
  });

  it('writes history and updates the existing URL when one already exists', async () => {
    const reportId = '22222222-2222-2222-2222-222222222222';
    const businessGuid = 'business-guid';
    const userGuid = 'user-guid';
    const userId = 'user-id';
    const currentUrl = {
      url_id: 'existing-url',
      report_id: reportId,
      report_url: 'https://old.example.com',
      create_user_id: 'old-user',
      update_user_id: 'old-user',
      create_date: new Date('2023-12-31T00:00:00.000Z'),
      update_date: new Date('2023-12-31T00:00:00.000Z'),
    };
    const updatedUrl = {
      ...currentUrl,
      report_url: 'https://new.example.com',
      update_user_id: userId,
      update_date: new Date('2024-01-02T00:00:00.000Z'),
    };

    prisma.pay_transparency_report.findFirst.mockResolvedValueOnce({
      report_id: reportId,
    } as pay_transparency_report);
    prisma.pay_transparency_report_url.findUnique.mockResolvedValueOnce(
      currentUrl,
    );
    prisma.pay_transparency_user.findFirst.mockResolvedValueOnce({
      user_id: userId,
    } as pay_transparency_user);
    prisma.report_url_history.create.mockResolvedValueOnce(
      {} as report_url_history,
    );
    prisma.pay_transparency_report_url.update.mockResolvedValueOnce(updatedUrl);

    const result = await createOrUpdateReportUrlSafe(
      reportId,
      'https://new.example.com',
      businessGuid,
      userGuid,
    );

    expect(result).toEqual(updatedUrl);
    expect(prisma.report_url_history.create).toHaveBeenCalledWith({
      data: {
        url_id: currentUrl.url_id,
        create_date: currentUrl.create_date,
        update_date: currentUrl.update_date,
        create_user_id: currentUrl.create_user_id,
        update_user_id: currentUrl.update_user_id,
        report_id: currentUrl.report_id,
        report_url: currentUrl.report_url,
      },
    });
    expect(prisma.pay_transparency_report_url.update).toHaveBeenCalledWith({
      where: { url_id: currentUrl.url_id },
      data: {
        update_date: expect.any(Date),
        update_user_id: userId,
        report_url: 'https://new.example.com',
      },
    });
  });

  it('throws when the report is not found or the user is not authorized', async () => {
    prisma.pay_transparency_report.findFirst.mockResolvedValueOnce(null);

    await expect(
      createOrUpdateReportUrlSafe(
        '33333333-3333-3333-3333-333333333333',
        'https://example.com',
        'business-guid',
        'user-guid',
      ),
    ).rejects.toThrow('Report not found or user not authorized to update it');
  });

  it('throws when the user is not found', async () => {
    prisma.pay_transparency_report.findFirst.mockResolvedValueOnce({
      report_id: '33333333-3333-3333-3333-333333333333',
    } as pay_transparency_report);
    prisma.pay_transparency_report_url.findUnique.mockResolvedValueOnce(null);
    prisma.pay_transparency_user.findFirst.mockResolvedValueOnce(null);

    await expect(
      createOrUpdateReportUrlSafe(
        '33333333-3333-3333-3333-333333333333',
        'https://example.com',
        'business-guid',
        'user-guid',
      ),
    ).rejects.toThrow('User not found');
  });

  it('returns the current URL followed by the historical entries', async () => {
    const reportId = '44444444-4444-4444-4444-444444444444';
    const currentUrl = {
      url_id: 'current-url',
      report_id: reportId,
      report_url: 'https://current.example.com',
    };
    const history = [
      {
        url_id: 'history-1',
        report_id: reportId,
        report_url: 'https://history-one.example.com',
      },
      {
        url_id: 'history-2',
        report_id: reportId,
        report_url: 'https://history-two.example.com',
      },
    ] as report_url_history[];

    prisma.pay_transparency_report_url.findUnique.mockResolvedValueOnce(
      currentUrl as pay_transparency_report_url,
    );
    prisma.report_url_history.findMany.mockResolvedValueOnce(history);

    const result = await getHistoryForReport(reportId);

    expect(result).toEqual([currentUrl, ...history]);
    expect(prisma.report_url_history.findMany).toHaveBeenCalledWith({
      where: { report_id: reportId },
      take: 100,
      orderBy: { update_date: 'desc' },
    });
  });

  it('returns empty array when there are no urls', async () => {
    const reportId = '44444444-4444-4444-4444-444444444444';
    const currentUrl = null;
    const history = [] as report_url_history[];

    prisma.pay_transparency_report_url.findUnique.mockResolvedValueOnce(
      currentUrl as pay_transparency_report_url,
    );
    prisma.report_url_history.findMany.mockResolvedValueOnce(history);

    const result = await getHistoryForReport(reportId);

    expect(result).toEqual([]);
  });

  describe('reportUrlSchema', () => {
    describe('valid URLs', () => {
      // prettier-ignore
      const dataValid = [
        { title: 'accepts a valid HTTPS URL', url: 'https://example.com' },
        { title: 'accepts a URL with 2 character TLD', url: 'https://example.ca', },
        { title: 'accepts HTTPS URL with path, query, and fragment', url: 'https://example.com/reports?id=123#summary', },
        { title: 'trims surrounding whitespace', url: '   https://example.com   ', },
        { title: 'accepts empty string', url: '' },
      ];
      it.for(dataValid)('$title', ({ url }) => {
        const result = reportUrlSchema.parse({
          reportUrl: url,
        });
        expect(result.reportUrl).toBe(url.trim());
      });
    });

    describe('invalid URLs', () => {
      // prettier-ignore
      const dataInvalid = [
        { title: 'rejects HTTP URLs', url: 'http://example.com' },
        { title: 'rejects non-URL text', url: 'not-a-url' },
        { title: 'rejects malformed HTTPS URLs', url: 'https://' },
        { title: 'rejects URLs with unsupported protocol', url: 'ftp://example.com' },
        { title: 'rejects javascript URLs', url: 'javascript:alert(1)' },
        { title: 'rejects bad TLDs', url: 'https://example.c' },
        { title: 'rejects missing TLDs', url: 'https://example' },
      ];
      it.for(dataInvalid)('$title', ({ url }) => {
        expect(() =>
          reportUrlSchema.parse({
            reportUrl: url,
          }),
        ).toThrow();
      });
    });

    describe('length validation', () => {
      it('rejects values longer than 4000 characters', () => {
        const longUrl = `https://example.com/${'a'.repeat(5000)}`;

        expect(() =>
          reportUrlSchema.parse({
            reportUrl: longUrl,
          }),
        ).toThrow();
      });
    });
  });
});
