import {
  DateTimeFormatter,
  LocalDateTime,
  nativeJs,
  ZoneId,
} from '@js-joda/core';
import prisma from '../prisma/prisma-client';
import { enumReportStatus } from './report-service';
import { logger } from '../../logger';
import { Prisma } from '@prisma/client';
import { announcementService } from './announcements-service';
import { SSO } from './sso-service';
import emailService from '../../external/services/ches';
import { config } from '../../config';
import '@js-joda/timezone';
import { Locale } from '@js-joda/locale_en';
import { EMAIL_TEMPLATES } from '../email-templates';

const schedulerService = {
  /*
   *    Delete draft report and associated calculated data older than 24 hours
   *    - crontime and timezone in backend/.env
   */
  async deleteDraftReports() {
    const delete_date =
      LocalDateTime.now(ZoneId.UTC).minusDays(1).toString() + 'Z';

    logger.info('Delete Draft Reports older than : ' + delete_date);

    const reportWhereClause: Prisma.pay_transparency_reportWhereInput = {
      report_status: enumReportStatus.Draft,
      create_date: {
        lte: delete_date,
      },
    };

    await prisma.$transaction(async (tx) => {
      await tx.pay_transparency_calculated_data.deleteMany({
        where: {
          pay_transparency_report: reportWhereClause,
        },
      });

      await tx.pay_transparency_report.deleteMany({
        where: reportWhereClause,
      });
    });
  },

  async sendAnnouncementExpiringEmails() {
    if (!config.get('server:enableEmailExpiringAnnouncements')) return;

    const expiring = await announcementService.getExpiringAnnouncements();
    if (!expiring.length) return;

    const sso = await SSO.init();
    const users = await sso.getUsers();
    const emails = users.filter((u) => u.email).map((u) => u.email);
    const env = config.get('server:openshiftEnv');
    const envPrefix = env === 'PROD' ? '' : `[${env}] `; // If not prod, add environment as a prefix to the subject line
    const zone = ZoneId.of(config.get('server:schedulerTimeZone'));

    // Loop through expiring announcements and send emails
    for (const ann of expiring) {
      const expiryStr = nativeJs(ann.expires_on, ZoneId.UTC)
        .withZoneSameInstant(zone)
        .format(
          DateTimeFormatter.ofPattern("yyyy-MM-dd 'at' h:mm a").withLocale(
            Locale.CANADA,
          ),
        );
      logger.info(
        `Sending email to ${emails.length} addresses about announcement expiring on ${expiryStr}`,
      );
      const email = emailService.generateHtmlEmail(
        EMAIL_TEMPLATES.ANNOUNCEMENT_ALERT.subject(envPrefix),
        emails,
        EMAIL_TEMPLATES.ANNOUNCEMENT_ALERT.title,
        EMAIL_TEMPLATES.ANNOUNCEMENT_ALERT.body(ann.title, expiryStr),
      );
      await emailService.sendEmailWithRetry(email);
    }
  },
};

export { schedulerService };
