import moment from 'moment';
import prisma from '../prisma/prisma-client';
import type { pay_transparency_report } from '@prisma/client';
import { enumReportStatus, REPORT_DATE_FORMAT } from './report-service';

const schedulerService = {
  /*
   * TODO
   */
  async deleteDraftReports() {
    
  },
  async getDraftReports() {
        const delete_date = moment().subtract(24, 'hours').utc().toISOString();

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

        if (!reports) return null;

        reports.forEach((r) => {
          console.log(r.report_id)
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