import ejs from 'ejs';
import moment from 'moment';
import fs from 'node:fs/promises';
import puppeteer from 'puppeteer';
import { logger as log } from '../../logger';
import prisma from "../prisma/prisma-client";
import { CALCULATION_CODES } from './report-calc-service';
import { utils } from './utils-service';

const REPORT_TEMPLATE = "./src/templates/report.template.html";
const REPORT_TEMPLATE_SCRIPT = "./src/templates/report.script.js";
const GENDER_CHART_LABELS = {
  MALE: "Men",
  FEMALE: "Female",
  NON_BINARY: "Non-binary",
  UNKNOWN: "Prefer not to say / Unknown"
}

interface ReportAndCalculations {
  report: unknown,
  calculated_datas: unknown[]
};

const reportService = {

  /* 
  Fetches a report identified by the given reportId from the database, 
  along with the calculated data associated with that report 
  */
  async getReportAndCalculations(req, reportId: string): Promise<ReportAndCalculations> {
    let reportAndCalculations = null;
    const userInfo = utils.getSessionUser(req);
    if (!userInfo) {
      console.log(userInfo)
      log.error("Unable to look user info");
      throw new Error("Something went wrong")
    }

    await prisma.$transaction(async (tx) => {

      const payTransparencyCompany = await tx.pay_transparency_company.findFirst({
        where: {
          bceid_business_guid: userInfo._json.bceid_business_guid,
        }
      });

      const report = await tx.pay_transparency_report.findFirst({
        where: {
          company_id: payTransparencyCompany.company_id,
          report_id: reportId,
        },
        include: {
          pay_transparency_company: true,
          naics_code_pay_transparency_report_naics_codeTonaics_code: true,
          employee_count_range: true
        },
      });

      if (!report) {
        throw new Error("Not found")
      }

      const calculatedDatas = await tx.pay_transparency_calculated_data.findMany({
        where: {
          report_id: reportId,
        },
        include: {
          calculation_code: true
        }
      });

      // Reorganize the calculation data results into an object of this format:
      // [CALCULATION CODE 1] => [VALUE]    
      // [CALCULATION CODE 2] => [VALUE] 
      // ...etc
      const calcs = {};
      calculatedDatas.forEach(c => {
        calcs[c.calculation_code.calculation_code] = c.value;
      });

      reportAndCalculations = {
        report: report,
        calculations: calcs
      };

    });

    return reportAndCalculations;
  },

  async getReportHtml(req, reportId: string): Promise<string> {
    const reportAndCalculations = await this.getReportAndCalculations(req, reportId);
    const calcs = reportAndCalculations.calculations;

    // Isolate specific calculations to show on specific graphs
    const meanHourlyPayGapData = [
      { label: GENDER_CHART_LABELS.MALE, value: calcs[CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_M] },
      { label: GENDER_CHART_LABELS.FEMALE, value: calcs[CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_W] },
      { label: GENDER_CHART_LABELS.NON_BINARY, value: calcs[CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_X] },
      { label: GENDER_CHART_LABELS.UNKNOWN, value: calcs[CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_U] }
    ];
    const medianHourlyPayGapData = [
      { label: GENDER_CHART_LABELS.MALE, value: calcs[CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_M] },
      { label: GENDER_CHART_LABELS.FEMALE, value: calcs[CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_W] },
      { label: GENDER_CHART_LABELS.NON_BINARY, value: calcs[CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_X] },
      { label: GENDER_CHART_LABELS.UNKNOWN, value: calcs[CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_U] }
    ];

    const ejsTemplate = await fs.readFile(REPORT_TEMPLATE, { encoding: 'utf8' });
    const templateParams = {
      report: {
        companyName: reportAndCalculations.report.pay_transparency_company.company_name,
        companyAddress: `${reportAndCalculations.report.pay_transparency_company.address_line1} ${reportAndCalculations.report.pay_transparency_company.address_line2}`.trim(),
        reportStartDate: moment(reportAndCalculations.report.report_start_date).startOf("month").format("MMMM D, YYYY"),
        reportEndDate: moment(reportAndCalculations.report.report_end_date).endOf("month").format("MMMM D, YYYY"),
        naicsCode: reportAndCalculations.report.naics_code_pay_transparency_report_naics_codeTonaics_code.naics_code,
        naicsLabel: reportAndCalculations.report.naics_code_pay_transparency_report_naics_codeTonaics_code.naics_label,
        employeeCountRange: reportAndCalculations.report.employee_count_range.employee_count_range,
        dataConstraints: reportAndCalculations.report.data_constraints,
        comments: reportAndCalculations.report.user_comment,
      },
      charts: {
        //  meanHourlyPayGap: await this.horizontalBarChart(meanHourlyPayGapData),
        //  medianHourlyPayGap: await this.horizontalBarChart(medianHourlyPayGapData)
      }
    };


    const workingHtml = ejs.render(ejsTemplate, templateParams);
    let renderedHtml = null;

    await (async () => {
      const browser = await puppeteer.launch({ headless: "new", dumpio: true, args: ['--enable-logging', '--v=1', '--allow-file-access-from-files'] });
      const page = await browser.newPage();
      page.on('console', (d) => {
        console.log(d)
      })

      // Note: page.addScriptTag() must come before page.setContent()
      await page.addScriptTag({ path: './node_modules/d3/dist/d3.min.js' })
      await page.addScriptTag({ path: REPORT_TEMPLATE_SCRIPT })

      await page.setContent(workingHtml, { waitUntil: 'networkidle0' });



      await page.evaluate(() => {
        const chartColors = [
          "#1c3664", //Male
          "#1b75bb", //Female
          "#00a54f", //Non-binary
          "#444444"  //Unknown
        ];

        document.getElementById("mean-hourly-pay-gap-chart").appendChild(
          // @ts-ignore
          horizontalBarChart([
            { "label": "Male", "value": "1" },
            { "label": "Female", "value": "0.93" },
            { "label": "Non binary", "value": "0.95" },
            { "label": "Unknown", "value": "0.91" }
          ], chartColors)
        );
        document.getElementById("median-hourly-pay-gap-chart").appendChild(
          // @ts-ignore
          horizontalBarChart([
            { "label": "Male", "value": "1" },
            { "label": "Female", "value": "0.94" },
            { "label": "Non binary", "value": "0.88" },
            { "label": "Unknown", "value": "0.90" }
          ], chartColors)
        )

      })
      const div = await page.$('#median-hourly-pay-gap-chart');
      console.log(div)
      renderedHtml = await page.content();

      await browser.close();
    })();


    return renderedHtml;
  },



}

export { reportService };

