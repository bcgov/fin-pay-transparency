import ejs from 'ejs';
import moment from 'moment';
import fs from 'node:fs/promises';
import { resolve } from 'path';
import puppeteer from 'puppeteer';
import { config } from '../../config';
import { logger as log } from '../../logger';
import prisma from "../prisma/prisma-client";
import { CALCULATION_CODES } from './report-calc-service';
import { utils } from './utils-service';


const GENDER_LABELS = {
  MALE: "Men",
  FEMALE: "Women",
  NON_BINARY: "Non-binary",
  UNKNOWN: "Prefer not to say / Unknown"
}

const GENDER_CODES = {
  MALE: "M",
  FEMALE: "W",
  NON_BINARY: "X",
  UNKNOWN: "U"
}

interface ReportAndCalculations {
  report: any,
  calculations: {}
};

const reportServicePrivate = {
  REPORT_TEMPLATE: resolve(config.get('server:templatePath') || "", "report.template.html"),
  REPORT_TEMPLATE_SCRIPT: resolve(config.get('server:templatePath') || "", "report.script.js"),

  genderCodeToLabel: (genderCode) => {
    const matches = Object.keys(GENDER_CODES).filter(k => GENDER_CODES[k] == genderCode).map(k => GENDER_LABELS[k]);
    return matches?.length ? matches[0] : 0;
  }
}

const reportService = {

  /* 
  Fetches a report identified by the given reportId from the database, 
  along with the calculated data associated with that report 
  */
  async getReportAndCalculations(req, reportId: string): Promise<ReportAndCalculations> {
    let reportAndCalculations: ReportAndCalculations | null = null;
    const userInfo = utils.getSessionUser(req);
    if (!userInfo) {
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
      // [CALCULATION CODE 1] => { value: "100", isSuppressed: false }
      // [CALCULATION CODE 2] => { value: "200", isSuppressed: false }
      // ...etc
      const calcs = {};
      calculatedDatas.forEach(c => {
        calcs[c.calculation_code.calculation_code] =
        {
          value: c.value,
          isSuppressed: c.is_suppressed
        };
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

    // Organize specific calculations to show on specific graphs
    const chartData = {
      meanHourlyPayGap: [
        { label: GENDER_LABELS.MALE, value: 1 - parseFloat(calcs[CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_M].value) },
        { label: GENDER_LABELS.FEMALE, value: 1 - parseFloat(calcs[CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_W].value) },
        { label: GENDER_LABELS.NON_BINARY, value: 1 - parseFloat(calcs[CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_X].value) },
        { label: GENDER_LABELS.UNKNOWN, value: 1 - parseFloat(calcs[CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_U].value) }
      ],
      medianHourlyPayGap: [
        { label: GENDER_LABELS.MALE, value: 1 - parseFloat(calcs[CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_M].value) },
        { label: GENDER_LABELS.FEMALE, value: 1 - parseFloat(calcs[CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_W].value) },
        { label: GENDER_LABELS.NON_BINARY, value: 1 - parseFloat(calcs[CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_X].value) },
        { label: GENDER_LABELS.UNKNOWN, value: 1 - parseFloat(calcs[CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_U].value) }
      ],
      meanOvertimePayGap: [
        { label: GENDER_LABELS.MALE, value: 1 - parseFloat(calcs[CALCULATION_CODES.MEAN_OT_PAY_DIFF_M].value) },
        { label: GENDER_LABELS.FEMALE, value: 1 - parseFloat(calcs[CALCULATION_CODES.MEAN_OT_PAY_DIFF_W].value) },
        { label: GENDER_LABELS.NON_BINARY, value: 1 - parseFloat(calcs[CALCULATION_CODES.MEAN_OT_PAY_DIFF_X].value) },
        { label: GENDER_LABELS.UNKNOWN, value: 1 - parseFloat(calcs[CALCULATION_CODES.MEAN_OT_PAY_DIFF_U].value) }
      ],
      medianOvertimePayGap: [
        { label: GENDER_LABELS.MALE, value: 1 - parseFloat(calcs[CALCULATION_CODES.MEDIAN_OT_PAY_DIFF_M].value) },
        { label: GENDER_LABELS.FEMALE, value: 1 - parseFloat(calcs[CALCULATION_CODES.MEDIAN_OT_PAY_DIFF_W].value) },
        { label: GENDER_LABELS.NON_BINARY, value: 1 - parseFloat(calcs[CALCULATION_CODES.MEDIAN_OT_PAY_DIFF_X].value) },
        { label: GENDER_LABELS.UNKNOWN, value: 1 - parseFloat(calcs[CALCULATION_CODES.MEDIAN_OT_PAY_DIFF_U].value) }
      ],
      meanBonusPayGap: [
        { label: GENDER_LABELS.MALE, value: 1 - parseFloat(calcs[CALCULATION_CODES.MEAN_BONUS_PAY_DIFF_M].value) },
        { label: GENDER_LABELS.FEMALE, value: 1 - parseFloat(calcs[CALCULATION_CODES.MEAN_BONUS_PAY_DIFF_W].value) },
        { label: GENDER_LABELS.NON_BINARY, value: 1 - parseFloat(calcs[CALCULATION_CODES.MEAN_BONUS_PAY_DIFF_X].value) },
        { label: GENDER_LABELS.UNKNOWN, value: 1 - parseFloat(calcs[CALCULATION_CODES.MEAN_BONUS_PAY_DIFF_U].value) }
      ],
      medianBonusPayGap: [
        { label: GENDER_LABELS.MALE, value: 1 - parseFloat(calcs[CALCULATION_CODES.MEDIAN_BONUS_PAY_DIFF_M].value) },
        { label: GENDER_LABELS.FEMALE, value: 1 - parseFloat(calcs[CALCULATION_CODES.MEDIAN_BONUS_PAY_DIFF_W].value) },
        { label: GENDER_LABELS.NON_BINARY, value: 1 - parseFloat(calcs[CALCULATION_CODES.MEDIAN_BONUS_PAY_DIFF_X].value) },
        { label: GENDER_LABELS.UNKNOWN, value: 1 - parseFloat(calcs[CALCULATION_CODES.MEDIAN_BONUS_PAY_DIFF_U].value) }
      ]
    }

    const ejsTemplate = await fs.readFile(reportServicePrivate.REPORT_TEMPLATE, { encoding: 'utf8' });
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
        referenceGenderCategory: reportServicePrivate.genderCodeToLabel(calcs[CALCULATION_CODES.REFERENCE_GENDER_CATEGORY_CODE]),
        meanOvertimeHoursGap: [
          { genderCode: GENDER_CODES.MALE, label: GENDER_LABELS.MALE, value: Math.round(parseFloat(calcs[CALCULATION_CODES.MEAN_OT_HOURS_DIFF_M])) },
          { genderCode: GENDER_CODES.FEMALE, label: GENDER_LABELS.FEMALE, value: Math.round(parseFloat(calcs[CALCULATION_CODES.MEAN_OT_HOURS_DIFF_W])) },
          { genderCode: GENDER_CODES.NON_BINARY, label: GENDER_LABELS.NON_BINARY, value: Math.round(parseFloat(calcs[CALCULATION_CODES.MEAN_OT_HOURS_DIFF_X])) },
          { genderCode: GENDER_CODES.UNKNOWN, label: GENDER_LABELS.UNKNOWN, value: Math.round(parseFloat(calcs[CALCULATION_CODES.MEAN_OT_HOURS_DIFF_U])) }
        ].filter(d => d.genderCode != calcs[CALCULATION_CODES.REFERENCE_GENDER_CATEGORY_CODE]),
        medianOvertimeHoursGap: [
          { genderCode: GENDER_CODES.MALE, label: GENDER_LABELS.MALE, value: Math.round(parseFloat(calcs[CALCULATION_CODES.MEDIAN_OT_HOURS_DIFF_M])) },
          { genderCode: GENDER_CODES.FEMALE, label: GENDER_LABELS.FEMALE, value: Math.round(parseFloat(calcs[CALCULATION_CODES.MEDIAN_OT_HOURS_DIFF_W])) },
          { genderCode: GENDER_CODES.NON_BINARY, label: GENDER_LABELS.NON_BINARY, value: Math.round(parseFloat(calcs[CALCULATION_CODES.MEDIAN_OT_HOURS_DIFF_X])) },
          { genderCode: GENDER_CODES.UNKNOWN, label: GENDER_LABELS.UNKNOWN, value: Math.round(parseFloat(calcs[CALCULATION_CODES.MEDIAN_OT_HOURS_DIFF_U])) }
        ].filter(d => d.genderCode != calcs[CALCULATION_CODES.REFERENCE_GENDER_CATEGORY_CODE]),
      }
    };

    const workingHtml = ejs.render(ejsTemplate, templateParams);
    let renderedHtml = null;

    await (async () => {

      // Launch a headless browser which we'll use to prepare the report as
      // an HTML web page.
      const browser = await puppeteer.launch({
        args: [
          '--no-sandbox', //required when running inside our docker container
          '--enable-logging',
          '--allow-file-access-from-files'
          //'--disable-setuid-sandbox',
          //'--disable-dev-shm-usage',
          //'--disable-gpu',
          //'--v=1',
        ],
        headless: 'new',
        dumpio: true,
        env: {
          //ELECTRON_DISABLE_SANDBOX: '1',
        },
      });

      const page = await browser.newPage();

      // Note: page.addScriptTag() must come before page.setContent()
      await page.addScriptTag({ path: './node_modules/d3/dist/d3.min.js' })
      await page.addScriptTag({ path: reportServicePrivate.REPORT_TEMPLATE_SCRIPT })

      await page.setContent(workingHtml, { waitUntil: 'networkidle0' });

      // Generate charts as SVG, and inject the charts into the DOM of the 
      // current page
      await page.evaluate((chartData) => {
        const chartColors = [
          "#1c3664", //Male
          "#1b75bb", //Female
          "#00a54f", //Non-binary
          "#444444"  //Unknown
        ];
        document.getElementById("mean-hourly-pay-gap-chart").appendChild(
          // @ts-ignore
          horizontalBarChart(chartData.meanHourlyPayGap, chartColors)
        );
        document.getElementById("median-hourly-pay-gap-chart").appendChild(
          // @ts-ignore
          horizontalBarChart(chartData.medianHourlyPayGap, chartColors)
        )
        document.getElementById("mean-overtime-pay-gap-chart").appendChild(
          // @ts-ignore
          horizontalBarChart(chartData.meanOvertimePayGap, chartColors)
        );
        document.getElementById("median-overtime-pay-gap-chart").appendChild(
          // @ts-ignore
          horizontalBarChart(chartData.medianOvertimePayGap, chartColors)
        )
        document.getElementById("mean-bonus-pay-gap-chart").appendChild(
          // @ts-ignore
          horizontalBarChart(chartData.meanOvertimePayGap, chartColors)
        );
        document.getElementById("median-bonus-pay-gap-chart").appendChild(
          // @ts-ignore
          horizontalBarChart(chartData.medianOvertimePayGap, chartColors)
        )

      }, chartData);

      // Extract the HTML of the active DOM, which includes the injected charts
      renderedHtml = await page.content();

      await browser.close();
    })();


    return renderedHtml;
  },



}

export { GENDER_CODES, ReportAndCalculations, reportService, reportServicePrivate };


