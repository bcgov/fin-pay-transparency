import { LocalDateTime, ZoneId } from '@js-joda/core';
import prisma from '../prisma/prisma-client';
import { enumReportStatus } from './report-service';

const schedulerService = {
  /*
   *    Delete draft reports older than 24 hours
   *    - configurable cron time in backend/config/index.ts
   *    
   */
  async deleteDraftReports() {
        const delete_date = LocalDateTime.now(ZoneId.UTC).minusHours(1).toString() + 'Z';
        
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

        //console.log(reports.length);

        if (!reports) return;

        /*
        reports.forEach((r) => {
          console.log(r.report_id)
        })        
        */

        //const strings = await prisma.pay_transparency_calculated_data.findMany({
        await prisma.pay_transparency_calculated_data.deleteMany({
          where: {
            report_id: {
              in: reports.map(function(report) { return report['report_id']; })
            }
          }
        })
        /*
        strings.map(function(report) { return report['calculated_data_id']; }).forEach((r) => {
          console.log(r)
        })
        */                
        
        //const strings = await prisma.pay_transparency_report.findMany({
        await prisma.pay_transparency_report.deleteMany({
          where: {
            report_id: {
              in: reports.map(function(report) { return report['report_id']; })
            }
          }
        }) 
        /*
        reports.map(function(report) { return report['report_id']; }).forEach((r) => {
          console.log(r)
        })
        */       
    },
}

export {schedulerService};