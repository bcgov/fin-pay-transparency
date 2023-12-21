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

interface ReportAndCalculations {
  report: any,
  calculations: {}
};

interface CalcCodeGenderCode {
  calculationCode: string,
  genderCode: string
}

interface ChartDataRecord {
  label: string,
  value: number,
  color: string
}

interface GenderChartInfo {
  code: string,
  label: string,
  color: string
}

const GENDERS = {
  MALE: { code: "M", label: "Men", color: "#1c3664" } as GenderChartInfo,
  FEMALE: { code: "F", label: "Women", color: "#1b75bb" } as GenderChartInfo,
  NON_BINARY: { code: "X", label: "Non-binary", color: "#00a54f" } as GenderChartInfo,
  UNKNOWN: { code: "U", label: "Prefer not to say / Unknown", color: "#444444" } as GenderChartInfo,
}

const reportServicePrivate = {
  REPORT_TEMPLATE: resolve(config.get('server:templatePath') || "", "report.template.html"),
  REPORT_TEMPLATE_SCRIPT: resolve(config.get('server:templatePath') || "", "report.script.js"),

  /*
  Converts a gender code (such as "M" or "U") into a GenderChartInfo
  object which includes information about how that gender category should 
  be shown in charts
  */
  genderCodeToGenderChartInfo(genderCode: string): GenderChartInfo {
    const matches = Object.keys(GENDERS).filter(k => GENDERS[k].code == genderCode).map(k => GENDERS[k]);
    return matches?.length ? matches[0] : null;
  },

  /* 
    Pay gaps are represented internally as percentages relative to
    a reference category.  For reporting this internal representation of
    pay gaps is converted into a dollar amount relative to the reference 
    category which is assumed to be $1.  This lets representation lets
    us show "for every $1 earned by a person in category A, a person
    in category B earn $X"  
    */
  payGapPercentToDollar(percent: number): number {
    return 1 - percent / 100;
  },

  /*
  Converts a CalcCodeGenderCode object (which identifies a calculation code
  and the gender code it corresponds to) into a ChartDataRecord object
  (which contains everything needed to draw the calculation corresponding
  to the calculation code on a chart).
  If a conversion is not possible, returns null.
  @param calculations is an object with calculation codes as keys,
  and values are objects of this format { value: "100", isSuppressed: false }
  For example:
    CALCULATION_CODE_1 => { value: "100", isSuppressed: false }
    CALCULATION_CODE_2 => { value: "200", isSuppressed: false }
  @param valueMapFunction: a function to convert the raw calculated value into 
  a different format.
  */
  toChartDataRecord(
    calculations: any,
    calcCodeGenderCode: CalcCodeGenderCode,
    valueMapFunction: Function = (d) => d
  ): ChartDataRecord | null {
    const hasCalc = calculations.hasOwnProperty(calcCodeGenderCode.calculationCode)
    if (!hasCalc || calculations[calcCodeGenderCode.calculationCode].isSuppressed) {
      return null;
    }
    const genderChartInfo = this.genderCodeToGenderChartInfo(calcCodeGenderCode.genderCode);
    if (!genderChartInfo) {
      throw new Error(`Unable to lookup GenderChartInfo for gender code '${calcCodeGenderCode.genderCode}'`);
    }
    return {
      label: genderChartInfo.label,
      value: valueMapFunction(parseFloat(calculations[calcCodeGenderCode.calculationCode].value)),
      color: genderChartInfo.color
    }
  },

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
          is_suppressed: false
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

    // Organize specific calculations to show on specific charts
    const chartData = {
      meanHourlyPayGap: [
        { genderCode: GENDERS.MALE.code, calculationCode: CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_M } as CalcCodeGenderCode,
        { genderCode: GENDERS.FEMALE.code, calculationCode: CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_W } as CalcCodeGenderCode,
        { genderCode: GENDERS.NON_BINARY.code, calculationCode: CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_X } as CalcCodeGenderCode,
        { genderCode: GENDERS.UNKNOWN.code, calculationCode: CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_U } as CalcCodeGenderCode
      ].map(d => reportServicePrivate.toChartDataRecord(calcs, d, reportServicePrivate.payGapPercentToDollar)).filter(d => d),
      medianHourlyPayGap: [
        { genderCode: GENDERS.MALE.code, calculationCode: CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_M } as CalcCodeGenderCode,
        { genderCode: GENDERS.FEMALE.code, calculationCode: CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_W } as CalcCodeGenderCode,
        { genderCode: GENDERS.NON_BINARY.code, calculationCode: CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_X } as CalcCodeGenderCode,
        { genderCode: GENDERS.UNKNOWN.code, calculationCode: CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_U } as CalcCodeGenderCode
      ].map(d => reportServicePrivate.toChartDataRecord(calcs, d, reportServicePrivate.payGapPercentToDollar)).filter(d => d),
      meanOvertimePayGap: [
        { genderCode: GENDERS.MALE.code, calculationCode: CALCULATION_CODES.MEAN_OT_PAY_DIFF_M } as CalcCodeGenderCode,
        { genderCode: GENDERS.FEMALE.code, calculationCode: CALCULATION_CODES.MEAN_OT_PAY_DIFF_W } as CalcCodeGenderCode,
        { genderCode: GENDERS.NON_BINARY.code, calculationCode: CALCULATION_CODES.MEAN_OT_PAY_DIFF_X } as CalcCodeGenderCode,
        { genderCode: GENDERS.UNKNOWN.code, calculationCode: CALCULATION_CODES.MEAN_OT_PAY_DIFF_U } as CalcCodeGenderCode
      ].map(d => reportServicePrivate.toChartDataRecord(calcs, d, reportServicePrivate.payGapPercentToDollar)).filter(d => d),
      medianOvertimePayGap: [
        { genderCode: GENDERS.MALE.code, calculationCode: CALCULATION_CODES.MEDIAN_OT_PAY_DIFF_M } as CalcCodeGenderCode,
        { genderCode: GENDERS.FEMALE.code, calculationCode: CALCULATION_CODES.MEDIAN_OT_PAY_DIFF_W } as CalcCodeGenderCode,
        { genderCode: GENDERS.NON_BINARY.code, calculationCode: CALCULATION_CODES.MEDIAN_OT_PAY_DIFF_X } as CalcCodeGenderCode,
        { genderCode: GENDERS.UNKNOWN.code, calculationCode: CALCULATION_CODES.MEDIAN_OT_PAY_DIFF_U } as CalcCodeGenderCode
      ].map(d => reportServicePrivate.toChartDataRecord(calcs, d, reportServicePrivate.payGapPercentToDollar)).filter(d => d),
      meanBonusPayGap: [
        { genderCode: GENDERS.MALE.code, calculationCode: CALCULATION_CODES.MEAN_BONUS_PAY_DIFF_M } as CalcCodeGenderCode,
        { genderCode: GENDERS.FEMALE.code, calculationCode: CALCULATION_CODES.MEAN_BONUS_PAY_DIFF_W } as CalcCodeGenderCode,
        { genderCode: GENDERS.NON_BINARY.code, calculationCode: CALCULATION_CODES.MEAN_BONUS_PAY_DIFF_X } as CalcCodeGenderCode,
        { genderCode: GENDERS.UNKNOWN.code, calculationCode: CALCULATION_CODES.MEAN_BONUS_PAY_DIFF_U } as CalcCodeGenderCode
      ].map(d => reportServicePrivate.toChartDataRecord(calcs, d, reportServicePrivate.payGapPercentToDollar)).filter(d => d),
      medianBonusPayGap: [
        { genderCode: GENDERS.MALE.code, calculationCode: CALCULATION_CODES.MEDIAN_BONUS_PAY_DIFF_M } as CalcCodeGenderCode,
        { genderCode: GENDERS.FEMALE.code, calculationCode: CALCULATION_CODES.MEDIAN_BONUS_PAY_DIFF_W } as CalcCodeGenderCode,
        { genderCode: GENDERS.NON_BINARY.code, calculationCode: CALCULATION_CODES.MEDIAN_BONUS_PAY_DIFF_X } as CalcCodeGenderCode,
        { genderCode: GENDERS.UNKNOWN.code, calculationCode: CALCULATION_CODES.MEDIAN_BONUS_PAY_DIFF_U } as CalcCodeGenderCode
      ].map(d => reportServicePrivate.toChartDataRecord(calcs, d, reportServicePrivate.payGapPercentToDollar)).filter(d => d)
    }

    console.log(chartData)

    const referenceGenderChartInfo = reportServicePrivate.genderCodeToGenderChartInfo(calcs[CALCULATION_CODES.REFERENCE_GENDER_CATEGORY_CODE]?.value)
    if (!referenceGenderChartInfo) {
      throw new Error(`Cannot find chart info for the reference category '${calcs[CALCULATION_CODES.REFERENCE_GENDER_CATEGORY_CODE]?.value}'`);
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
        referenceGenderCategory: referenceGenderChartInfo.label,
        meanOvertimeHoursGap: [
          { genderCode: GENDERS.MALE.code, calculationCode: CALCULATION_CODES.MEAN_OT_HOURS_DIFF_M } as CalcCodeGenderCode,
          { genderCode: GENDERS.FEMALE.code, calculationCode: CALCULATION_CODES.MEAN_OT_HOURS_DIFF_W } as CalcCodeGenderCode,
          { genderCode: GENDERS.NON_BINARY.code, calculationCode: CALCULATION_CODES.MEAN_OT_HOURS_DIFF_X } as CalcCodeGenderCode,
          { genderCode: GENDERS.UNKNOWN.code, calculationCode: CALCULATION_CODES.MEAN_OT_HOURS_DIFF_U } as CalcCodeGenderCode
        ].filter(d => d.genderCode != calcs[CALCULATION_CODES.REFERENCE_GENDER_CATEGORY_CODE].value)
          .map(d => reportServicePrivate.toChartDataRecord(calcs, d, Math.round))
          .filter(d => d),
        medianOvertimeHoursGap: [
          { genderCode: GENDERS.MALE.code, calculationCode: CALCULATION_CODES.MEDIAN_OT_HOURS_DIFF_M } as CalcCodeGenderCode,
          { genderCode: GENDERS.FEMALE.code, calculationCode: CALCULATION_CODES.MEDIAN_OT_HOURS_DIFF_W } as CalcCodeGenderCode,
          { genderCode: GENDERS.NON_BINARY.code, calculationCode: CALCULATION_CODES.MEDIAN_OT_HOURS_DIFF_X } as CalcCodeGenderCode,
          { genderCode: GENDERS.UNKNOWN.code, calculationCode: CALCULATION_CODES.MEDIAN_OT_HOURS_DIFF_U } as CalcCodeGenderCode
        ].filter(d => d.genderCode != calcs[CALCULATION_CODES.REFERENCE_GENDER_CATEGORY_CODE].value)
          .map(d => reportServicePrivate.toChartDataRecord(calcs, d, Math.round))
          .filter(d => d),
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
        const INSUFFICIENT_DATA_ERROR = "This measure cannot be displayed as the reference category has less than 10 employees";
        document.getElementById("mean-hourly-pay-gap-chart").appendChild(
          chartData.medianHourlyPayGap.length ?
            // @ts-ignore
            horizontalBarChart(chartData.meanHourlyPayGap) :
            document.createTextNode(INSUFFICIENT_DATA_ERROR)
        );
        document.getElementById("median-hourly-pay-gap-chart").appendChild(
          chartData.medianHourlyPayGap.length ?
            // @ts-ignore
            horizontalBarChart(chartData.medianHourlyPayGap) :
            document.createTextNode(INSUFFICIENT_DATA_ERROR)
        )
        document.getElementById("mean-overtime-pay-gap-chart").appendChild(
          chartData.meanOvertimePayGap.length ?
            // @ts-ignore
            horizontalBarChart(chartData.meanOvertimePayGap) :
            document.createTextNode(INSUFFICIENT_DATA_ERROR)
        );
        document.getElementById("median-overtime-pay-gap-chart").appendChild(
          chartData.medianOvertimePayGap.length ?
            // @ts-ignore
            horizontalBarChart(chartData.medianOvertimePayGap) :
            document.createTextNode(INSUFFICIENT_DATA_ERROR)
        )
        document.getElementById("mean-bonus-pay-gap-chart").appendChild(
          chartData.medianBonusPayGap.length ?
            // @ts-ignore
            horizontalBarChart(chartData.meanBonusPayGap) :
            document.createTextNode(INSUFFICIENT_DATA_ERROR)
        );
        document.getElementById("median-bonus-pay-gap-chart").appendChild(
          chartData.medianBonusPayGap.length ?
            // @ts-ignore
            horizontalBarChart(chartData.medianBonusPayGap) :
            document.createTextNode(INSUFFICIENT_DATA_ERROR)
        )

      }, chartData);

      // Extract the HTML of the active DOM, which includes the injected charts
      renderedHtml = await page.content();

      await browser.close();
    })();


    return renderedHtml;
  },



}

export { GENDERS, GenderChartInfo, ReportAndCalculations, reportService, reportServicePrivate };


