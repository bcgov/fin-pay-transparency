import moment from 'moment';
import { config } from '../../config';
import { logger as log, logger } from '../../logger';
import prisma from '../prisma/prisma-client';
import { CALCULATION_CODES, reportCalcService } from './report-calc-service';
import { utils } from './utils-service';

enum enumReportStatus {
  Draft = 'Draft',
  Published = 'Published',
}

interface ReportAndCalculations {
  report: any;
  calculations: {};
}

interface CalcCodeGenderCode {
  calculationCode: string;
  genderCode: string;
}

interface ChartDataRecord {
  genderChartInfo: GenderChartInfo;
  value: number;
}

interface GenderChartInfo {
  code: string;
  label: string;
  extendedLabel: string;
  color: string;
}

interface ExplanatoryNote {
  num: number;
  text: string;
}

const GENDERS = {
  MALE: {
    code: 'M',
    label: 'Men',
    extendedLabel: 'Men',
    color: '#1c3664',
  } as GenderChartInfo,
  FEMALE: {
    code: 'F',
    label: 'Women',
    extendedLabel: 'Women',
    color: '#1b75bb',
  } as GenderChartInfo,
  NON_BINARY: {
    code: 'X',
    label: 'Non-binary',
    extendedLabel: 'Non-binary people',
    color: '#00a54f',
  } as GenderChartInfo,
  UNKNOWN: {
    code: 'U',
    label: 'Prefer not to say / Unknown',
    extendedLabel: 'Prefer not to say / Unknown',
    color: '#444444',
  } as GenderChartInfo,
};

const REPORT_DATE_FORMAT = 'YYYY-MM-DD';

const reportServicePrivate = {
  /*
  Converts a gender code (such as "M" or "U") into a GenderChartInfo
  object which includes information about how that gender category should
  be shown in charts
  */
  genderCodeToGenderChartInfo(genderCode: string): GenderChartInfo {
    const matches = Object.keys(GENDERS)
      .filter((k) => GENDERS[k].code == genderCode)
      .map((k) => GENDERS[k]);
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
    valueMapFunction: Function = (d) => d,
  ): ChartDataRecord | null {
    const hasCalc = calculations.hasOwnProperty(
      calcCodeGenderCode.calculationCode,
    );
    if (
      !hasCalc ||
      calculations[calcCodeGenderCode.calculationCode].isSuppressed
    ) {
      return null;
    }
    const genderChartInfo = this.genderCodeToGenderChartInfo(
      calcCodeGenderCode.genderCode,
    );
    if (!genderChartInfo) {
      throw new Error(
        `Unable to lookup GenderChartInfo for gender code '${calcCodeGenderCode.genderCode}'`,
      );
    }
    return {
      genderChartInfo: genderChartInfo,
      value: valueMapFunction(
        parseFloat(calculations[calcCodeGenderCode.calculationCode].value),
      ),
    };
  },

  /*
    This method converts the raw data that could be used to draw a bar chart
    of gender pay gaps into a text summary of the data.  The text summary 
    will be of a form similar to:
      "In this company, women’s average hourly wages 
      are 9% less than men while non-binary people’s  
      average hourly wages are 7% less than men. For every 
      dollar a man earns on average, women earn 91 cents on 
      average and non-binary people earn 93 cents on 
      average."
    @referenceGenderCode: the gender code of the reference gender.  (e.g. M or X)
    @param chartDataRecords: an array of chart data records that are to be summarized
    @param statisticName: the name of the statistic being summarized in the 
    chart data records (e.g. "mean" or "median")
    @param measureName: the name of the pay category being summarized 
    (e.g. "hourly wages" or "overtime pay")
    @param measureNameIsPlural: a flag indicating whether the text of the 
    'measureName' is written in plural. (i.e. whether it should be 
    followed by "is" or "are")
    */
  getWageGapTextSummary(
    referenceGenderCode: string,
    chartDataRecords: ChartDataRecord[],
    statisticName: string,
    measureName: string,
    measureNameIsPlural: boolean = true,
  ) {
    const refChartDataRecord = chartDataRecords.filter(
      (d) => d.genderChartInfo.code == referenceGenderCode,
    )[0];

    if (chartDataRecords.length < 2) {
      return null;
    }

    const isOrAre = measureNameIsPlural ? 'are' : 'is';

    const typeASummaries: string[] = [];
    const typeBSummaries: string[] = [];
    chartDataRecords.forEach((d: ChartDataRecord) => {
      if (
        d.genderChartInfo.code != referenceGenderCode &&
        d.genderChartInfo.code != GENDERS.UNKNOWN.code
      ) {
        const diffFromReference = d.value - refChartDataRecord.value;
        const moreOrLess = diffFromReference > 0 ? 'more' : 'less';
        const diffPercent = Math.round(Math.abs(diffFromReference * 100));
        const moneyText = this.dollarsToText(d.value);
        typeASummaries.push(
          `${d.genderChartInfo.extendedLabel.toLowerCase()}'s ${statisticName} ${measureName} ${isOrAre} ${diffPercent}% ${moreOrLess} than ${refChartDataRecord.genderChartInfo.extendedLabel.toLowerCase()}'s`,
        );
        typeBSummaries.push(
          `${d.genderChartInfo.extendedLabel.toLowerCase()} earn ${moneyText}`,
        );
      }
    });

    const result = `
    In this organization ${typeASummaries.join(' and ')}.  
    For every dollar ${refChartDataRecord.genderChartInfo.extendedLabel.toLowerCase()} earn in ${statisticName} ${measureName}, 
    ${typeBSummaries.join(' and ')} in ${statisticName} ${measureName}.`;
    return result;
  },

  /*
    This method converts the raw data that could be used to draw a bar chart
    of gaps in hours worked between gender groups into a text summary of the 
    data.  The text summary 
    will be of a form similar to:
      "In this company, women worked 28 fewer paid overtime 
      hours than men on average, while non-binary people 
      worked 15 fewer paid overtime hours than men on 
      average"
    @referenceGenderCode: the gender code of the reference gender.  (e.g. M or X)
    @param chartDataRecords: an array of chart data records that are to be summarized
    @param statisticName: the name of the statistic being summarized in the 
    chart data records (e.g. "mean" or "median")
    @param measureName: the name of the data category being summarized 
    (e.g. "overtime hours")
    */
  getHoursGapTextSummary(
    referenceGenderCode: string,
    chartDataRecords: ChartDataRecord[],
    statisticName: string,
    measureName: string,
  ) {
    const refGenderChartInfo: GenderChartInfo =
      reportServicePrivate.genderCodeToGenderChartInfo(referenceGenderCode);

    if (chartDataRecords.length < 2) {
      return null;
    }

    const summaries: string[] = [];
    chartDataRecords.forEach((d: ChartDataRecord) => {
      if (
        d.genderChartInfo.code != referenceGenderCode &&
        d.genderChartInfo.code != GENDERS.UNKNOWN.code
      ) {
        const diffFromReference = d.value;
        const moreOrLess = diffFromReference > 0 ? 'more' : 'less';
        const diffHours = Math.round(Math.abs(diffFromReference));
        summaries.push(
          `the ${statisticName} number of ${measureName} worked by ${d.genderChartInfo.extendedLabel.toLowerCase()} was ${diffHours} ${moreOrLess} than by ${refGenderChartInfo.extendedLabel.toLowerCase()}`,
        );
      }
    });

    const result = `In this organization ${summaries.join(' and ')}.`;
    return result;
  },

  /*
  Creates a text summary of the 4th and 1st hourly pay quartiles
  in a form similar to:
  "In this organization, women occupy 30% of the highest paid 
  jobs and 56% of the lowest paid jobs. Non-binary people occupy 
  1% of the highest paid jobs and 2% of the lowest paid jobs."
  */
  getHourlyPayQuartilesTextSummary(
    referenceGenderCode: string,
    hourlyPayQuartile4: ChartDataRecord[],
    hourlyPayQuartile1: ChartDataRecord[],
  ): string {
    const genderCodesToSkip = [referenceGenderCode, GENDERS.UNKNOWN.code];
    const genderCodesToSummarize = Object.values(GENDERS).filter(
      (d) => genderCodesToSkip.indexOf(d.code) == -1,
    );

    const genderSummaries = [];
    genderCodesToSummarize.forEach((g, i) => {
      const genderLabel =
        i == 0 ? g.extendedLabel.toLocaleLowerCase() : g.extendedLabel;
      const q4 = hourlyPayQuartile4.filter(
        (c) => c.genderChartInfo.code == g.code,
      );
      const q1 = hourlyPayQuartile1.filter(
        (c) => c.genderChartInfo.code == g.code,
      );
      const quartileSummaries = [];
      if (q4.length) {
        const q4Percent = Math.round(q4[0].value);
        quartileSummaries.push(`${q4Percent}% of the highest paid jobs`);
      }
      if (q1.length) {
        const q1Percent = Math.round(q1[0].value);
        quartileSummaries.push(`${q1Percent}% of the lowest paid jobs`);
      }
      if (quartileSummaries.length) {
        genderSummaries.push(
          `${genderLabel} occupy ${quartileSummaries.join(' and ')}`,
        );
      }
    });

    let text = null;
    if (genderSummaries.length) {
      text = `In this organization, ${genderSummaries[0]}.`;
    }
    for (let i = 1; i < genderSummaries.length; i++) {
      text += ` ${genderSummaries[i]}.`;
    }

    return text;
  },

  /*
  converts a number representing an amount in dollars (such as 1.20 or 0.95)
  into a string according to the following rules:
  - if the given number is less than 1, return "x cents" (e.g. 0.95 => "95 cents")
  - if the given number is greater than or equal to 1, return a string with
    a dollars sign followed by a value in dollars (e.g. 1.2 => "$1.20")
  */
  dollarsToText(amountDollars: number): string {
    if (amountDollars < 0) {
      throw new Error(
        'Expected a positive number representing am amount in dollars',
      );
    }
    amountDollars = Math.round(amountDollars * 100) / 100;
    if (amountDollars < 1) {
      return `${Math.round(amountDollars * 100)} cents`;
    }
    return `$${amountDollars.toFixed(2)}`;
  },
};

const reportService = {
  /*
  Fetches a report identified by the given reportId from the database,
  along with the calculated data associated with that report
  */
  async getReportAndCalculations(
    req,
    reportId: string,
  ): Promise<ReportAndCalculations> {
    let reportAndCalculations: ReportAndCalculations | null = null;
    const userInfo = utils.getSessionUser(req);
    if (!userInfo) {
      log.error('Unable to look user info');
      throw new Error('Something went wrong');
    }

    await prisma.$transaction(async (tx) => {
      const payTransparencyCompany =
        await tx.pay_transparency_company.findFirst({
          where: {
            bceid_business_guid: userInfo._json.bceid_business_guid,
          },
        });

      const report = await tx.pay_transparency_report.findFirst({
        where: {
          company_id: payTransparencyCompany.company_id,
          report_id: reportId,
        },
        include: {
          pay_transparency_company: true,
          naics_code_pay_transparency_report_naics_codeTonaics_code: true,
          employee_count_range: true,
        },
      });

      if (!report) {
        throw new Error('Not found');
      }

      const calculatedDatas =
        await tx.pay_transparency_calculated_data.findMany({
          where: {
            report_id: reportId,
            is_suppressed: false,
          },
          include: {
            calculation_code: true,
          },
        });

      // Reorganize the calculation data results into an object of this format:
      // [CALCULATION CODE 1] => { value: "100", isSuppressed: false }
      // [CALCULATION CODE 2] => { value: "200", isSuppressed: false }
      // ...etc
      const calcs = {};
      calculatedDatas.forEach((c) => {
        calcs[c.calculation_code.calculation_code] = {
          value: c.value,
          isSuppressed: c.is_suppressed,
        };
      });

      reportAndCalculations = {
        report: report,
        calculations: calcs,
      };
    });

    return reportAndCalculations;
  },

  /*
  Create an object listing all explanatory notes (footnote number, and note text)
  that will appear in the report.  The returned object has the following format:
  {
    meanHourlyPayDiff: { num: 1, text: "Note 1 text here" },
    medianHourlyPayDiff: { num: 2, text: "Note 2 text here" },
    ...
    where the object keys are code values that uniquely identify each explanatory
    note, and the values are objects that include the note number and text.
  }
  */
  createExplanatoryNotes(report: any) {
    const explanatoryNotes = {};
    let nextNum = 1;
    if (report.data_constraints) {
      explanatoryNotes['dataConstraints'] = {
        num: nextNum++,
        text: report.data_constraints,
      } as ExplanatoryNote;
    }

    //assign numbers to all the other notes
    const noteCodes = [
      'meanHourlyPayDiff',
      'medianHourlyPayDiff',
      'meanOvertimePayDiff',
      'medianOvertimePayDiff',
      'meanOvertimeHoursDiff',
      'medianOvertimeHoursDiff',
      'meanBonusPayDiff',
      'medianBonusPayDiff',
      'payQuartiles',
    ];
    noteCodes.forEach((noteCode) => {
      explanatoryNotes[noteCode] = {
        num: nextNum++,
        //don't include the text.  the template file has the text of the note
      } as ExplanatoryNote;
    });

    return explanatoryNotes;
  },

  async getReportData(req, reportId: string): Promise<object> {
    logger.debug(
      `getReportHtml called with reportId: ${reportId} and correlationId: ${req.session?.correlationID}`,
    );
    const reportAndCalculations = await this.getReportAndCalculations(
      req,
      reportId,
    );
    const report = reportAndCalculations.report;
    const calcs = reportAndCalculations.calculations;
    const referenceGenderCode: string =
      calcs[CALCULATION_CODES.REFERENCE_GENDER_CATEGORY_CODE].value;

    // Organize specific calculations to show on specific charts
    const chartData = {
      meanHourlyPayGap: [
        {
          genderCode: GENDERS.MALE.code,
          calculationCode: CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_M,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.FEMALE.code,
          calculationCode: CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_W,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.NON_BINARY.code,
          calculationCode: CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_X,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.UNKNOWN.code,
          calculationCode: CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_U,
        } as CalcCodeGenderCode,
      ]
        .map((d) =>
          reportServicePrivate.toChartDataRecord(
            calcs,
            d,
            reportServicePrivate.payGapPercentToDollar,
          ),
        )
        .filter((d) => d),
      medianHourlyPayGap: [
        {
          genderCode: GENDERS.MALE.code,
          calculationCode: CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_M,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.FEMALE.code,
          calculationCode: CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_W,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.NON_BINARY.code,
          calculationCode: CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_X,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.UNKNOWN.code,
          calculationCode: CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_U,
        } as CalcCodeGenderCode,
      ]
        .map((d) =>
          reportServicePrivate.toChartDataRecord(
            calcs,
            d,
            reportServicePrivate.payGapPercentToDollar,
          ),
        )
        .filter((d) => d),
      meanOvertimePayGap: [
        {
          genderCode: GENDERS.MALE.code,
          calculationCode: CALCULATION_CODES.MEAN_OT_PAY_DIFF_M,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.FEMALE.code,
          calculationCode: CALCULATION_CODES.MEAN_OT_PAY_DIFF_W,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.NON_BINARY.code,
          calculationCode: CALCULATION_CODES.MEAN_OT_PAY_DIFF_X,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.UNKNOWN.code,
          calculationCode: CALCULATION_CODES.MEAN_OT_PAY_DIFF_U,
        } as CalcCodeGenderCode,
      ]
        .map((d) =>
          reportServicePrivate.toChartDataRecord(
            calcs,
            d,
            reportServicePrivate.payGapPercentToDollar,
          ),
        )
        .filter((d) => d),
      medianOvertimePayGap: [
        {
          genderCode: GENDERS.MALE.code,
          calculationCode: CALCULATION_CODES.MEDIAN_OT_PAY_DIFF_M,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.FEMALE.code,
          calculationCode: CALCULATION_CODES.MEDIAN_OT_PAY_DIFF_W,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.NON_BINARY.code,
          calculationCode: CALCULATION_CODES.MEDIAN_OT_PAY_DIFF_X,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.UNKNOWN.code,
          calculationCode: CALCULATION_CODES.MEDIAN_OT_PAY_DIFF_U,
        } as CalcCodeGenderCode,
      ]
        .map((d) =>
          reportServicePrivate.toChartDataRecord(
            calcs,
            d,
            reportServicePrivate.payGapPercentToDollar,
          ),
        )
        .filter((d) => d),
      percentReceivingOvertimePay: [
        {
          genderCode: GENDERS.MALE.code,
          calculationCode: CALCULATION_CODES.PERCENT_RECEIVING_OT_PAY_M,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.FEMALE.code,
          calculationCode: CALCULATION_CODES.PERCENT_RECEIVING_OT_PAY_W,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.NON_BINARY.code,
          calculationCode: CALCULATION_CODES.PERCENT_RECEIVING_OT_PAY_X,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.UNKNOWN.code,
          calculationCode: CALCULATION_CODES.PERCENT_RECEIVING_OT_PAY_U,
        } as CalcCodeGenderCode,
      ]
        .map((d) => reportServicePrivate.toChartDataRecord(calcs, d))
        .filter((d) => d),
      meanBonusPayGap: [
        {
          genderCode: GENDERS.MALE.code,
          calculationCode: CALCULATION_CODES.MEAN_BONUS_PAY_DIFF_M,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.FEMALE.code,
          calculationCode: CALCULATION_CODES.MEAN_BONUS_PAY_DIFF_W,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.NON_BINARY.code,
          calculationCode: CALCULATION_CODES.MEAN_BONUS_PAY_DIFF_X,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.UNKNOWN.code,
          calculationCode: CALCULATION_CODES.MEAN_BONUS_PAY_DIFF_U,
        } as CalcCodeGenderCode,
      ]
        .map((d) =>
          reportServicePrivate.toChartDataRecord(
            calcs,
            d,
            reportServicePrivate.payGapPercentToDollar,
          ),
        )
        .filter((d) => d),
      medianBonusPayGap: [
        {
          genderCode: GENDERS.MALE.code,
          calculationCode: CALCULATION_CODES.MEDIAN_BONUS_PAY_DIFF_M,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.FEMALE.code,
          calculationCode: CALCULATION_CODES.MEDIAN_BONUS_PAY_DIFF_W,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.NON_BINARY.code,
          calculationCode: CALCULATION_CODES.MEDIAN_BONUS_PAY_DIFF_X,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.UNKNOWN.code,
          calculationCode: CALCULATION_CODES.MEDIAN_BONUS_PAY_DIFF_U,
        } as CalcCodeGenderCode,
      ]
        .map((d) =>
          reportServicePrivate.toChartDataRecord(
            calcs,
            d,
            reportServicePrivate.payGapPercentToDollar,
          ),
        )
        .filter((d) => d),
      percentReceivingBonusPay: [
        {
          genderCode: GENDERS.MALE.code,
          calculationCode: CALCULATION_CODES.PERCENT_RECEIVING_BONUS_PAY_M,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.FEMALE.code,
          calculationCode: CALCULATION_CODES.PERCENT_RECEIVING_BONUS_PAY_W,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.NON_BINARY.code,
          calculationCode: CALCULATION_CODES.PERCENT_RECEIVING_BONUS_PAY_X,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.UNKNOWN.code,
          calculationCode: CALCULATION_CODES.PERCENT_RECEIVING_BONUS_PAY_U,
        } as CalcCodeGenderCode,
      ]
        .map((d) => reportServicePrivate.toChartDataRecord(calcs, d))
        .filter((d) => d),
      hourlyPayQuartile1: [
        {
          genderCode: GENDERS.MALE.code,
          calculationCode: CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_1_M,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.FEMALE.code,
          calculationCode: CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_1_W,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.NON_BINARY.code,
          calculationCode: CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_1_X,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.UNKNOWN.code,
          calculationCode: CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_1_U,
        } as CalcCodeGenderCode,
      ]
        .map((d) => reportServicePrivate.toChartDataRecord(calcs, d))
        .filter((d) => d),
      hourlyPayQuartile2: [
        {
          genderCode: GENDERS.MALE.code,
          calculationCode: CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_2_M,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.FEMALE.code,
          calculationCode: CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_2_W,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.NON_BINARY.code,
          calculationCode: CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_2_X,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.UNKNOWN.code,
          calculationCode: CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_2_U,
        } as CalcCodeGenderCode,
      ]
        .map((d) => reportServicePrivate.toChartDataRecord(calcs, d))
        .filter((d) => d),
      hourlyPayQuartile3: [
        {
          genderCode: GENDERS.MALE.code,
          calculationCode: CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_3_M,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.FEMALE.code,
          calculationCode: CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_3_W,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.NON_BINARY.code,
          calculationCode: CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_3_X,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.UNKNOWN.code,
          calculationCode: CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_3_U,
        } as CalcCodeGenderCode,
      ]
        .map((d) => reportServicePrivate.toChartDataRecord(calcs, d))
        .filter((d) => d),
      hourlyPayQuartile4: [
        {
          genderCode: GENDERS.MALE.code,
          calculationCode: CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_4_M,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.FEMALE.code,
          calculationCode: CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_4_W,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.NON_BINARY.code,
          calculationCode: CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_4_X,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.UNKNOWN.code,
          calculationCode: CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_4_U,
        } as CalcCodeGenderCode,
      ]
        .map((d) => reportServicePrivate.toChartDataRecord(calcs, d))
        .filter((d) => d),
    };

    chartData['hourlyPayQuartilesLegend'] = [
      GENDERS.MALE,
      GENDERS.FEMALE,
      GENDERS.NON_BINARY,
      GENDERS.UNKNOWN,
    ].filter(
      (d) =>
        // Only include Gender categories that appear in at least on
        // hourly pay quartile
        [
          ...chartData.hourlyPayQuartile1,
          ...chartData.hourlyPayQuartile2,
          ...chartData.hourlyPayQuartile3,
          ...chartData.hourlyPayQuartile4,
        ].filter((v) => v.genderChartInfo.code == d.code).length,
    );

    const tableData = {
      meanOvertimeHoursGap: [
        {
          genderCode: GENDERS.MALE.code,
          calculationCode: CALCULATION_CODES.MEAN_OT_HOURS_DIFF_M,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.FEMALE.code,
          calculationCode: CALCULATION_CODES.MEAN_OT_HOURS_DIFF_W,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.NON_BINARY.code,
          calculationCode: CALCULATION_CODES.MEAN_OT_HOURS_DIFF_X,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.UNKNOWN.code,
          calculationCode: CALCULATION_CODES.MEAN_OT_HOURS_DIFF_U,
        } as CalcCodeGenderCode,
      ]
        .filter((d) => d.genderCode != referenceGenderCode)
        .map((d) =>
          reportServicePrivate.toChartDataRecord(calcs, d, Math.round),
        )
        .filter((d) => d),
      medianOvertimeHoursGap: [
        {
          genderCode: GENDERS.MALE.code,
          calculationCode: CALCULATION_CODES.MEDIAN_OT_HOURS_DIFF_M,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.FEMALE.code,
          calculationCode: CALCULATION_CODES.MEDIAN_OT_HOURS_DIFF_W,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.NON_BINARY.code,
          calculationCode: CALCULATION_CODES.MEDIAN_OT_HOURS_DIFF_X,
        } as CalcCodeGenderCode,
        {
          genderCode: GENDERS.UNKNOWN.code,
          calculationCode: CALCULATION_CODES.MEDIAN_OT_HOURS_DIFF_U,
        } as CalcCodeGenderCode,
      ]
        .filter((d) => d.genderCode != referenceGenderCode)
        .map((d) =>
          reportServicePrivate.toChartDataRecord(calcs, d, Math.round),
        )
        .filter((d) => d),
    };

    const chartSummaryText = {
      meanHourlyPayGap: reportServicePrivate.getWageGapTextSummary(
        referenceGenderCode,
        chartData.meanHourlyPayGap,
        'average',
        'hourly wages',
        true,
      ),
      medianHourlyPayGap: reportServicePrivate.getWageGapTextSummary(
        referenceGenderCode,
        chartData.medianHourlyPayGap,
        'median',
        'hourly wages',
        true,
      ),
      meanOvertimePayGap: reportServicePrivate.getWageGapTextSummary(
        referenceGenderCode,
        chartData.meanOvertimePayGap,
        'average',
        'overtime pay',
        false,
      ),
      medianOvertimePayGap: reportServicePrivate.getWageGapTextSummary(
        referenceGenderCode,
        chartData.medianOvertimePayGap,
        'median',
        'overtime pay',
        false,
      ),
      meanBonusPayGap: reportServicePrivate.getWageGapTextSummary(
        referenceGenderCode,
        chartData.meanBonusPayGap,
        'average',
        'bonus pay',
        false,
      ),
      medianBonusPayGap: reportServicePrivate.getWageGapTextSummary(
        referenceGenderCode,
        chartData.medianBonusPayGap,
        'median',
        'bonus pay',
        false,
      ),
      meanOvertimeHoursGap: reportServicePrivate.getHoursGapTextSummary(
        referenceGenderCode,
        tableData.meanOvertimeHoursGap,
        'average',
        'overtime hours',
      ),
      medianOvertimeHoursGap: reportServicePrivate.getHoursGapTextSummary(
        referenceGenderCode,
        tableData.medianOvertimeHoursGap,
        'median',
        'overtime hours',
      ),
      hourlyPayQuartiles: reportServicePrivate.getHourlyPayQuartilesTextSummary(
        referenceGenderCode,
        chartData.hourlyPayQuartile4,
        chartData.hourlyPayQuartile1,
      ),
    };

    const referenceGenderChartInfo =
      reportServicePrivate.genderCodeToGenderChartInfo(
        calcs[CALCULATION_CODES.REFERENCE_GENDER_CATEGORY_CODE]?.value,
      );
    if (!referenceGenderChartInfo) {
      throw new Error(
        `Cannot find chart info for the reference category '${
          calcs[CALCULATION_CODES.REFERENCE_GENDER_CATEGORY_CODE]?.value
        }'`,
      );
    }

    const reportData = {
      companyName: report.pay_transparency_company.company_name,
      companyAddress:
        `${report.pay_transparency_company.address_line1} ${report.pay_transparency_company.address_line2}`.trim(),
      reportStartDate: moment(report.report_start_date)
        .startOf('month')
        .format('MMMM D, YYYY'),
      reportEndDate: moment(report.report_end_date)
        .endOf('month')
        .format('MMMM D, YYYY'),
      naicsCode:
        report.naics_code_pay_transparency_report_naics_codeTonaics_code
          .naics_code,
      naicsLabel:
        report.naics_code_pay_transparency_report_naics_codeTonaics_code
          .naics_label,
      employeeCountRange: report.employee_count_range.employee_count_range,
      comments: report.user_comment,
      referenceGenderCategory: referenceGenderChartInfo.label,
      chartSuppressedError: `This measure cannot be displayed as the reference category (${referenceGenderChartInfo.label}) has less than ${reportCalcService.MIN_REQUIRED_PEOPLE_WITH_DATA_COUNT} employees.`,
      tableData: tableData,
      chartData: chartData,
      chartSummaryText: chartSummaryText,
      explanatoryNotes: this.createExplanatoryNotes(report),
    };

    return reportData;
  },

  async getReportHtml(req, reportId: string): Promise<string> {
    const reportData = this.getReportData(req, reportId);
    const responseHtml = await utils.postDataToDocGenService(
      reportData,
      `${config.get('docGenService:url')}/doc-gen?reportType=html`,
      req.session.correlationID,
    );
    logger.debug(
      `getReportHtml completed with reportId: ${reportId} and correlationId: ${req.session?.correlationID}`,
    );
    return responseHtml;
  },

  async getReportPdf(req, reportId: string): Promise<Buffer> {
    const reportData = this.getReportData(req, reportId);
    const responsePdf = await utils.postDataToDocGenService(
      reportData,
      `${config.get('docGenService:url')}/doc-gen?reportType=pdf`,
      req.session.correlationID,
      {
        headers: {
          Accept: 'application/pdf',
        },
        responseType: 'stream',
      },
    );
    logger.debug(
      `getReportPdf completed with reportId: ${reportId} and correlationId: ${req.session?.correlationID}`,
    );
    return responsePdf;
  },

  /**
   * Return a list of reports associated with the current user's
   * business BCeID.  Allow filtering by report status and start/end date.
   * If the filter object is provided, the report_start_date and
   * report_end_date params must be given as "YYYY-MM-DD" strings.
   */
  async getReports(
    bceidBusinessGuid: string,
    filters?: {
      report_status?: enumReportStatus;
      report_start_date?: string;
      report_end_date?: string;
    },
  ) {
    // Prisma queries require dates used in the 'where' clause to be specified
    // in ISO-8601 format (i.e. date + time + timezone).  If datestrings
    // were included in the filters parameter, convert those into the
    // required format.
    if (filters?.report_start_date) {
      filters.report_start_date = moment
        .utc(filters.report_start_date, REPORT_DATE_FORMAT)
        .toISOString();
    }
    if (filters?.report_end_date) {
      filters.report_end_date = moment
        .utc(filters.report_end_date, REPORT_DATE_FORMAT)
        .toISOString();
    }

    const reports = await prisma.pay_transparency_company.findFirst({
      select: {
        pay_transparency_report: {
          select: {
            report_id: true,
            report_start_date: true,
            report_end_date: true,
            report_status: true,
            revision: true,
          },
          where: filters,
          orderBy: [
            {
              report_start_date: 'desc',
            },
            {
              update_date: 'desc',
            },
          ],
        },
      },
      where: {
        bceid_business_guid: bceidBusinessGuid,
      },
    });

    // Convert the data type for report_start_date and report_end_date from
    // a Date object into a date string formatted with REPORT_DATE_FORMAT
    const reportsAdjusted = reports?.pay_transparency_report.map((r) => {
      const report = {
        ...r,
      } as any;
      report.report_start_date = moment
        .utc(r.report_start_date)
        .format(REPORT_DATE_FORMAT);
      report.report_end_date = moment
        .utc(r.report_end_date)
        .format(REPORT_DATE_FORMAT);
      return report;
    });

    return reportsAdjusted;
  },

  /**
   *
   * @param bceidBusinessGuid
   * @param reportId
   * @returns
   *    - object for a single report or
   *    - null or undefined if report couldn't be found
   */
  async getReportById(bceidBusinessGuid: string, reportId: string) {
    const reports = await prisma.pay_transparency_company.findFirst({
      select: {
        pay_transparency_report: {
          select: {
            report_id: true,
            user_comment: true,
            employee_count_range_id: true,
            naics_code: true,
            report_start_date: true,
            report_end_date: true,
            report_status: true,
            revision: true,
            data_constraints: true,
          },
          where: {
            report_id: reportId,
          },
          take: 1,
        },
      },
      where: {
        bceid_business_guid: bceidBusinessGuid,
      },
    });
    if (!reports) return null;
    const [first] = reports.pay_transparency_report;
    return first;
  },

  async getReportFileName(
    bceidBusinessGuid: string,
    reportId: string,
  ): Promise<string> {
    const report = await this.getReportById(bceidBusinessGuid, reportId);
    if (report) {
      const start = moment(report.report_start_date).format('YYYY-MM');
      const end = moment(report.report_end_date).format('YYYY-MM');
      const filename = `pay_transparency_report_${start}_${end}.pdf`;
      return filename;
    }
  },
};

export {
  CalcCodeGenderCode,
  GENDERS,
  GenderChartInfo,
  REPORT_DATE_FORMAT,
  ReportAndCalculations,
  enumReportStatus,
  reportService,
  reportServicePrivate,
};
