import type {
  pay_transparency_report_url,
  Prisma,
} from '../prisma/generated/client.js';
import prisma from '../prisma/prisma-client.js';
import { z } from 'zod';

// Validations

export const reportUrlSchema = z.object({
  reportUrl: z
    .string()
    .trim()
    .min(1)
    .max(4000)
    .url()
    .refine((url) => url.startsWith('https://') && URL.canParse(url), {
      message: 'reportUrl must be a valid HTTPS URL',
    }),
});
export type ReportUrlType = z.infer<typeof reportUrlSchema>;

export const reportIdSchema = z.object({
  reportId: z.string().uuid(),
});
export type ReportIdType = z.infer<typeof reportIdSchema>;

// Helper functions

async function writeHistory(
  tx: Prisma.TransactionClient,
  record: pay_transparency_report_url,
) {
  return tx.report_url_history.create({
    data: {
      url_id: record.url_id,
      create_date: record.create_date,
      update_date: record.update_date,
      create_user_id: record.create_user_id,
      update_user_id: record.update_user_id,
      report_id: record.report_id,
      report_url: record.report_url,
    },
  });
}

// Exported functions

export const createOrUpdateReportUrlSafe = async (
  reportId: string,
  reportUrl: string,
  businessGuid: string,
  userGuid: string,
) => {
  return prisma.$transaction(async (tx) => {
    // Safe - The report must exist, and the user must be authorized to update it.
    const report = await tx.pay_transparency_report.findFirst({
      where: {
        report_id: reportId,
        pay_transparency_company: { bceid_business_guid: businessGuid },
      },
      select: { report_id: true },
    });

    if (!report) {
      throw new Error('Report not found or user not authorized to update it');
    }

    // Get an existing url if there is one.
    const existing = await tx.pay_transparency_report_url.findUnique({
      where: {
        report_id: reportId,
      },
    });

    // Get user_id
    const user = await tx.pay_transparency_user.findFirst({
      where: {
        bceid_user_guid: userGuid,
        bceid_business_guid: businessGuid,
      },
      select: { user_id: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    let record;
    if (existing) {
      // If there is an existing record, write it to history and update it.
      await writeHistory(tx, existing);
      record = await tx.pay_transparency_report_url.update({
        where: { url_id: existing.url_id },
        data: {
          update_date: new Date(),
          update_user_id: user.user_id,
          report_url: reportUrl,
        },
      });
    } else
      // If there is no existing record, create a new one.
      record = await tx.pay_transparency_report_url.create({
        data: {
          create_user_id: user.user_id,
          update_user_id: user.user_id,
          report_id: reportId,
          report_url: reportUrl,
        },
      });

    return record;
  });
};

/**
 * Full report-url history for an employer, most recent first.
 */
export const getHistoryForReport = async (reportId: string) => {
  const recent = await prisma.pay_transparency_report_url.findUnique({
    where: { report_id: reportId },
  });
  const history = await prisma.report_url_history.findMany({
    where: { report_id: reportId },
    take: 100,
    orderBy: { create_date: 'desc' },
  });
  return [recent, ...history];
};
