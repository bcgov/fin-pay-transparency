import { LocalDate, LocalDateTime, ZoneId, DateTimeFormatter } from '@js-joda/core';
import { Locale } from '@js-joda/locale_en';
import prisma from '../prisma/prisma-client';
import { enumReportStatus, REPORT_DATE_FORMAT, JODA_FORMATTER } from './report-service';

const schedulerService = {
  /*
   * TODO
   */
  async deleteDraftReports() {
        //const dateFormatter = DateTimeFormatter.ofPattern(REPORT_DATE_FORMAT).withLocale(Locale.CANADA);
        //const delete_date = dateFormatter.now(ZoneId.UTC).minusDays(1).format(JODA_FORMATTER);

        //const delete_date = now(ZoneId.UTC).minusDays(1).format(JODA_FORMATTER);

        const delete_date = LocalDateTime.now(ZoneId.UTC).minusDays(1).toString() + 'Z';

        //console.log(delete_date);

        const reports = await prisma.pay_transparency_report.findMany({
          select: {
            report_id: true,
          },
            where: {
                report_status: enumReportStatus.Draft,
                create_date: {
                  lte: delete_date
                }, 
            },
        }); 

        console.log(reports.length);

        //if (!reports) return null;

        reports.forEach((r) => {
          //console.log(r.report_id)
        })        
 
        /*
        await prisma.pay_transparency_report.deleteMany({
          where: {
            report_id: {
              in: reports
            }
          }
        })   
        */     
    },
}

export {schedulerService};