import { parse } from 'csv-parse';
import { Readable } from 'stream';
import { CSV_COLUMNS, GENDER_CODES, NUMERIC_COLUMNS, validateService } from './validate-service';


const CALCULATION_CODES = {
  REFERENCE_GENDER_CATEGORY_CODE: "REFERENCE_GENDER_CATEGORY_CODE",
  MEAN_HOURLY_PAY_DIFF_M: "MEAN_HOURLY_PAY_DIFF_M",
  MEAN_HOURLY_PAY_DIFF_W: "MEAN_HOURLY_PAY_DIFF_W",
  MEAN_HOURLY_PAY_DIFF_X: "MEAN_HOURLY_PAY_DIFF_X",
  MEAN_HOURLY_PAY_DIFF_U: "MEAN_HOURLY_PAY_DIFF_U",
  MEDIAN_HOURLY_PAY_DIFF_M: "MEDIAN_HOURLY_PAY_DIFF_M",
  MEDIAN_HOURLY_PAY_DIFF_W: "MEDIAN_HOURLY_PAY_DIFF_W",
  MEDIAN_HOURLY_PAY_DIFF_X: "MEDIAN_HOURLY_PAY_DIFF_X",
  MEDIAN_HOURLY_PAY_DIFF_U: "MEDIAN_HOURLY_PAY_DIFF_U",
  MEAN_OT_PAY_DIFF_M: "MEAN_OT_PAY_DIFF_M",
  MEAN_OT_PAY_DIFF_W: "MEAN_OT_PAY_DIFF_W",
  MEAN_OT_PAY_DIFF_X: "MEAN_OT_PAY_DIFF_X",
  MEAN_OT_PAY_DIFF_U: "MEAN_OT_PAY_DIFF_U",
  MEDIAN_OT_PAY_DIFF_M: "MEDIAN_OT_PAY_DIFF_M",
  MEDIAN_OT_PAY_DIFF_W: "MEDIAN_OT_PAY_DIFF_W",
  MEDIAN_OT_PAY_DIFF_X: "MEDIAN_OT_PAY_DIFF_X",
  MEDIAN_OT_PAY_DIFF_U: "MEDIAN_OT_PAY_DIFF_U",
  MEAN_OT_HOURS_DIFF_M: "MEAN_OT_HOURS_DIFF_M",
  MEAN_OT_HOURS_DIFF_W: "MEAN_OT_HOURS_DIFF_W",
  MEAN_OT_HOURS_DIFF_X: "MEAN_OT_HOURS_DIFF_X",
  MEAN_OT_HOURS_DIFF_U: "MEAN_OT_HOURS_DIFF_U",
  MEDIAN_OT_HOURS_DIFF_M: "MEDIAN_OT_HOURS_DIFF_M",
  MEDIAN_OT_HOURS_DIFF_W: "MEDIAN_OT_HOURS_DIFF_W",
  MEDIAN_OT_HOURS_DIFF_X: "MEDIAN_OT_HOURS_DIFF_X",
  MEDIAN_OT_HOURS_DIFF_U: "MEDIAN_OT_HOURS_DIFF_U",
  MEAN_BONUS_PAY_DIFF_M: "MEAN_BONUS_PAY_DIFF_M",
  MEAN_BONUS_PAY_DIFF_W: "MEAN_BONUS_PAY_DIFF_W",
  MEAN_BONUS_PAY_DIFF_X: "MEAN_BONUS_PAY_DIFF_X",
  MEAN_BONUS_PAY_DIFF_U: "MEAN_BONUS_PAY_DIFF_U",
  MEDIAN_BONUS_PAY_DIFF_M: "MEDIAN_BONUS_PAY_DIFF_M",
  MEDIAN_BONUS_PAY_DIFF_W: "MEDIAN_BONUS_PAY_DIFF_W",
  MEDIAN_BONUS_PAY_DIFF_X: "MEDIAN_BONUS_PAY_DIFF_X",
  MEDIAN_BONUS_PAY_DIFF_U: "MEDIAN_BONUS_PAY_DIFF_U",
}

interface CalculatedAmount {
  calculationCode: string,
  value: string,
  isSuppressed: boolean
}
/*
This is a helper class which can be used to incrementally collect values
representing separate measurements of a certain type. For example, it can 
collect a list of values representing Bonus Pay for different people.
The class insits that each value value be associated with a gender category. 
There are functions to calculate statistics on the list of values in each 
gender category subset.

Use of this class to collect values might look something like this:
  
  const bonusPayStats = new StatisticsHelper();
  people.forEach(person => {
    bonusPayStats.push(person.bonusPay, person.gender);
  });

Statistics broken down by gender category, can be
accessed as follows: 

  const meanBonusPayMale = bonusPayStats.getMean("male");
  const meanBonusPayFemale = bonusPayStats.getMean("female");
  const medianBonusPayMale = bonusPayStats.getMedian("male");
  const medianBonusPayFemale = bonusPayStats.getMedian("female");
*/
class ColumnStats {

  static REF_CATEGORY_PREFERENCE = [GENDER_CODES.MALE, GENDER_CODES.NON_BINARY, GENDER_CODES.UNKNOWN];
  static MIN_REQUIRED_COUNT_FOR_REF_CATEGORY = 10;
  static MIN_REQUIRED_COUNT_FOR_NOT_SUPPRESSED = 10;

  dataByCategoryKey: any;
  isSorted: boolean;

  constructor() {
    this.dataByCategoryKey = {};
    this.isSorted = true;
  }

  push(value: number, genderCode: string) {
    const standardizedGenderCode = validateService.standardizeGenderCode(genderCode);
    if (!this.dataByCategoryKey.hasOwnProperty(standardizedGenderCode)) {
      this.dataByCategoryKey[standardizedGenderCode] = [];
    }
    this.dataByCategoryKey[standardizedGenderCode].push(value)
    this.isSorted = false;
  }

  /* Sort the the array of values in each gender category. */
  sortEachGenderCategory() {
    if (this.isSorted) {
      return; //already sorted
    }
    Object.keys(this.dataByCategoryKey).forEach(k => {
      this.dataByCategoryKey[k].sort();
    });
  }

  getValues(genderCode: string) {
    const standardizedGenderCode = validateService.standardizeGenderCode(genderCode);
    const values = this.dataByCategoryKey.hasOwnProperty(standardizedGenderCode) ?
      this.dataByCategoryKey[standardizedGenderCode] :
      [];
    return values;
  }

  /*
  Returns a gender code that should be used as the reference for
  this set of values. The returned gender code is a 'raw' value, not
  a value produced by running the raw value through 
  validateService.standardizeGenderCode(rawGenderCode)
  */
  getReferenceGenderCode(): string {
    let referenceGenderCode: string = null;
    const genderCategories = Object.values(ColumnStats.REF_CATEGORY_PREFERENCE);
    for (let genderCodeSynonyms of genderCategories) {

      // Arbitrarily pick any one value from the list
      // of synonyms for this gender category
      const genderCode = genderCodeSynonyms[0];

      const numPeopleInGenderCategory = this.getCount(genderCode);
      if (numPeopleInGenderCategory >= ColumnStats.MIN_REQUIRED_COUNT_FOR_REF_CATEGORY) {
        referenceGenderCode = genderCode;
        //break out of forEach loop
        break;
      }
    };
    return referenceGenderCode;
  }

  getCount(genderCode: string) {
    const values = this.getValues(genderCode);
    return values.length;
  }

  /*
  Determines whether the values stored for the given genderCode meet the
  criteria for calculations related to this gender category to be suppressed.
   */
  isSuppressed(genderCode: string): boolean {
    const count = this.getCount(genderCode);
    return count < ColumnStats.MIN_REQUIRED_COUNT_FOR_NOT_SUPPRESSED;
  }

  /* Calculate and return the mean (average) from the array of values
  associated with the given genderCode */
  getMean(genderCode: string) {
    const sum = this.getValues(genderCode).reduce(
      (accumulator, v) => accumulator + v,
      0,
    );
    const count = this.getCount(genderCode);
    const avg = count != 0 ?
      sum / count :
      0;
    return avg;
  }

  /* Calculate and return the median from the array of values
  associated with the given genderCode  */
  getMedian(genderCode: string) {
    // The logic in this function relies on the array of values for
    // a given genderCode being sorted.  Sort now to be sure.
    this.sortEachGenderCategory();

    const values = this.getValues(genderCode);
    if (!values?.length) {
      return 0;
    }
    if (values.length % 2 == 1) { //odd number of values      
      const median = values[Math.floor(values.length / 2)];
      return median;
    }
    // Must be an even number of values.  
    // Return the average of the two middle values
    const index2 = Math.floor(values.length / 2);
    const index1 = index2 - 1;
    const avgOfTwo = (values[index1] + values[index2]) / 2;
    return avgOfTwo;
  }

}

const reportCalcService = {

  /*
    Scans the entire CSV file and calculates all the amounts needed for the report.
    Returns an array of all the CalculatedAmounts.
  */
  async calculateAll(csvReadable: Readable): Promise<CalculatedAmount[]> {
    const calculatedAmounts: CalculatedAmount[] = [];
    const csvParser = csvReadable
      .pipe(parse({
        columns: true,
        bom: true,
        trim: true,
        ltrim: true,
        skip_empty_lines: true,
        relax_column_count: true
      }));

    // Create objects to manage data and statistics for specific columns
    const hourlyPayStats = new ColumnStats();
    const overtimePayStats = new ColumnStats();
    const overtimeHoursStats = new ColumnStats();
    const bonusPayStats = new ColumnStats();

    // Scan each row from the CSV file, and push the value of each column
    // into the objects that will be used to manage the column data and stats
    for await (const csvRecord of csvParser) {
      reportCalcServicePrivate.cleanCsvRecord(csvRecord);
      const hourlyPayDollars = reportCalcServicePrivate.getHourlyPayDollars(csvRecord);
      const overtimePayDollarsPerHour = csvRecord[CSV_COLUMNS.OVERTIME_PAY];
      const overtimeHours = csvRecord[CSV_COLUMNS.OVERTIME_HOURS];
      const bonusPayDollars = csvRecord[CSV_COLUMNS.BONUS_PAY];
      hourlyPayStats.push(hourlyPayDollars, csvRecord[CSV_COLUMNS.GENDER_CODE]);
      overtimePayStats.push(overtimePayDollarsPerHour, csvRecord[CSV_COLUMNS.GENDER_CODE]);
      overtimeHoursStats.push(overtimeHours, csvRecord[CSV_COLUMNS.GENDER_CODE]);
      bonusPayStats.push(bonusPayDollars, csvRecord[CSV_COLUMNS.GENDER_CODE]);
    }

    // Perform calculations on the raw CSV data, and collect them
    // into an array of CalculatedAmount objects
    // (Each CalculatedAmount has a code indicating which calculation it
    // represents, and a value for that calculation)
    calculatedAmounts.push(...reportCalcServicePrivate.calculateMeanHourlyPayGaps(hourlyPayStats));
    calculatedAmounts.push(...reportCalcServicePrivate.calculateMedianHourlyPayGaps(hourlyPayStats));
    calculatedAmounts.push(...reportCalcServicePrivate.calculateMeanOvertimePayGaps(overtimePayStats));
    calculatedAmounts.push(...reportCalcServicePrivate.calculateMedianOvertimePayGaps(overtimePayStats));
    calculatedAmounts.push(...reportCalcServicePrivate.calculateMeanOvertimeHoursGaps(overtimeHoursStats));
    calculatedAmounts.push(...reportCalcServicePrivate.calculateMedianOvertimeHoursGaps(overtimeHoursStats));
    calculatedAmounts.push(...reportCalcServicePrivate.calculateMeanBonusPayGaps(bonusPayStats));
    calculatedAmounts.push(...reportCalcServicePrivate.calculateMedianBonusPayGaps(bonusPayStats));

    // Although not technically a calculated amount, include the reference gender category 
    // code in the list of CalculatedAmounts
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.REFERENCE_GENDER_CATEGORY_CODE,
      value: hourlyPayStats.getReferenceGenderCode(),
      isSuppressed: hourlyPayStats.isSuppressed(hourlyPayStats.getReferenceGenderCode())
    });

    return calculatedAmounts;
  },

}

const reportCalcServicePrivate = {

  calculateMeanHourlyPayGaps(hourlyPayStats: ColumnStats): CalculatedAmount[] {
    const refGenderCode = hourlyPayStats.getReferenceGenderCode();

    let meanHourlyPayDiffM = null;
    let meanHourlyPayDiffF = null;
    let meanHourlyPayDiffX = null;
    let meanHourlyPayDiffU = null;

    if (refGenderCode) {
      const meanHourlyPayRef = hourlyPayStats.getMean(refGenderCode);
      if (!hourlyPayStats.isSuppressed(GENDER_CODES.MALE[0])) {
        meanHourlyPayDiffM =
          (meanHourlyPayRef - hourlyPayStats.getMean(GENDER_CODES.MALE[0])) /
          meanHourlyPayRef;
      }
      if (!hourlyPayStats.isSuppressed(GENDER_CODES.FEMALE[0])) {
        meanHourlyPayDiffF =
          (meanHourlyPayRef - hourlyPayStats.getMean(GENDER_CODES.FEMALE[0])) /
          meanHourlyPayRef;
      }
      if (!hourlyPayStats.isSuppressed(GENDER_CODES.NON_BINARY[0])) {
        meanHourlyPayDiffX =
          (meanHourlyPayRef - hourlyPayStats.getMean(GENDER_CODES.NON_BINARY[0])) /
          meanHourlyPayRef;
      }
      if (!hourlyPayStats.isSuppressed(GENDER_CODES.UNKNOWN[0])) {
        meanHourlyPayDiffU =
          (meanHourlyPayRef - hourlyPayStats.getMean(GENDER_CODES.UNKNOWN[0])) /
          meanHourlyPayRef;
      }
    }

    const calculatedAmounts = [];
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_M,
      value: meanHourlyPayDiffM,
      isSuppressed: meanHourlyPayDiffM === null
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_W,
      value: meanHourlyPayDiffF,
      isSuppressed: meanHourlyPayDiffF === null
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_X,
      value: meanHourlyPayDiffX,
      isSuppressed: meanHourlyPayDiffX === null
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_U,
      value: meanHourlyPayDiffU,
      isSuppressed: meanHourlyPayDiffU === null
    });

    return calculatedAmounts;
  },

  calculateMedianHourlyPayGaps(hourlyPayStats: ColumnStats): CalculatedAmount[] {
    const refGenderCode = hourlyPayStats.getReferenceGenderCode();

    let medianHourlyPayDiffM = null;
    let medianHourlyPayDiffF = null;
    let medianHourlyPayDiffX = null;
    let medianHourlyPayDiffU = null;

    if (refGenderCode) {
      const medianHourlyPayRef = hourlyPayStats.getMedian(refGenderCode);
      if (!hourlyPayStats.isSuppressed(GENDER_CODES.MALE[0])) {
        medianHourlyPayDiffM =
          (medianHourlyPayRef - hourlyPayStats.getMedian(GENDER_CODES.MALE[0])) /
          medianHourlyPayRef;
      }
      if (!hourlyPayStats.isSuppressed(GENDER_CODES.FEMALE[0])) {
        medianHourlyPayDiffF =
          (medianHourlyPayRef - hourlyPayStats.getMedian(GENDER_CODES.FEMALE[0])) /
          medianHourlyPayRef;
      }
      if (!hourlyPayStats.isSuppressed(GENDER_CODES.NON_BINARY[0])) {
        medianHourlyPayDiffX =
          (medianHourlyPayRef - hourlyPayStats.getMedian(GENDER_CODES.NON_BINARY[0])) /
          medianHourlyPayRef;
      }
      if (!hourlyPayStats.isSuppressed(GENDER_CODES.UNKNOWN[0])) {
        medianHourlyPayDiffU =
          (medianHourlyPayRef - hourlyPayStats.getMedian(GENDER_CODES.UNKNOWN[0])) /
          medianHourlyPayRef;
      }
    }

    const calculatedAmounts = [];
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_M,
      value: medianHourlyPayDiffM,
      isSuppressed: medianHourlyPayDiffM === null
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_W,
      value: medianHourlyPayDiffF,
      isSuppressed: medianHourlyPayDiffF === null
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_X,
      value: medianHourlyPayDiffX,
      isSuppressed: medianHourlyPayDiffX === null
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_U,
      value: medianHourlyPayDiffU,
      isSuppressed: medianHourlyPayDiffU === null
    });

    return calculatedAmounts;
  },

  calculateMeanOvertimePayGaps(overtimePayStats: ColumnStats): CalculatedAmount[] {
    const refGenderCode = overtimePayStats.getReferenceGenderCode();

    let meanOvertimePayDiffM = null;
    let meanOvertimePayDiffF = null;
    let meanOvertimePayDiffX = null;
    let meanOvertimePayDiffU = null;

    if (refGenderCode) {
      const meanOvertimePayRef = overtimePayStats.getMean(refGenderCode);
      if (!overtimePayStats.isSuppressed(GENDER_CODES.MALE[0])) {
        meanOvertimePayDiffM =
          (meanOvertimePayRef - overtimePayStats.getMean(GENDER_CODES.MALE[0])) /
          meanOvertimePayRef;
      }
      if (!overtimePayStats.isSuppressed(GENDER_CODES.FEMALE[0])) {
        meanOvertimePayDiffF =
          (meanOvertimePayRef - overtimePayStats.getMean(GENDER_CODES.FEMALE[0])) /
          meanOvertimePayRef;
      }
      if (!overtimePayStats.isSuppressed(GENDER_CODES.NON_BINARY[0])) {
        meanOvertimePayDiffX =
          (meanOvertimePayRef - overtimePayStats.getMean(GENDER_CODES.NON_BINARY[0])) /
          meanOvertimePayRef;
      }
      if (!overtimePayStats.isSuppressed(GENDER_CODES.UNKNOWN[0])) {
        meanOvertimePayDiffU =
          (meanOvertimePayRef - overtimePayStats.getMean(GENDER_CODES.UNKNOWN[0])) /
          meanOvertimePayRef;
      }
    }

    const calculatedAmounts = [];
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEAN_OT_PAY_DIFF_M,
      value: meanOvertimePayDiffM,
      isSuppressed: meanOvertimePayDiffM === null
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEAN_OT_PAY_DIFF_W,
      value: meanOvertimePayDiffF,
      isSuppressed: meanOvertimePayDiffF === null
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEAN_OT_PAY_DIFF_X,
      value: meanOvertimePayDiffX,
      isSuppressed: meanOvertimePayDiffX === null
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEAN_OT_PAY_DIFF_U,
      value: meanOvertimePayDiffU,
      isSuppressed: meanOvertimePayDiffU === null
    });

    return calculatedAmounts;
  },

  calculateMedianOvertimePayGaps(overtimePayStats: ColumnStats): CalculatedAmount[] {
    const refGenderCode = overtimePayStats.getReferenceGenderCode();

    let medianOvertimePayDiffM = null;
    let medianOvertimePayDiffF = null;
    let medianOvertimePayDiffX = null;
    let medianOvertimePayDiffU = null;

    if (refGenderCode) {
      const medianOvertimePayRef = overtimePayStats.getMedian(refGenderCode);
      if (!overtimePayStats.isSuppressed(GENDER_CODES.MALE[0])) {
        medianOvertimePayDiffM =
          (medianOvertimePayRef - overtimePayStats.getMedian(GENDER_CODES.MALE[0])) /
          medianOvertimePayRef;
      }
      if (!overtimePayStats.isSuppressed(GENDER_CODES.FEMALE[0])) {
        medianOvertimePayDiffF =
          (medianOvertimePayRef - overtimePayStats.getMedian(GENDER_CODES.FEMALE[0])) /
          medianOvertimePayRef;
      }
      if (!overtimePayStats.isSuppressed(GENDER_CODES.NON_BINARY[0])) {
        medianOvertimePayDiffX =
          (medianOvertimePayRef - overtimePayStats.getMedian(GENDER_CODES.NON_BINARY[0])) /
          medianOvertimePayRef;
      }
      if (!overtimePayStats.isSuppressed(GENDER_CODES.UNKNOWN[0])) {
        medianOvertimePayDiffU =
          (medianOvertimePayRef - overtimePayStats.getMedian(GENDER_CODES.UNKNOWN[0])) /
          medianOvertimePayRef;
      }
    }

    const calculatedAmounts = [];
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEDIAN_OT_PAY_DIFF_M,
      value: medianOvertimePayDiffM,
      isSuppressed: medianOvertimePayDiffM === null
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEDIAN_OT_PAY_DIFF_W,
      value: medianOvertimePayDiffF,
      isSuppressed: medianOvertimePayDiffF === null
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEDIAN_OT_PAY_DIFF_X,
      value: medianOvertimePayDiffX,
      isSuppressed: medianOvertimePayDiffX === null
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEDIAN_OT_PAY_DIFF_U,
      value: medianOvertimePayDiffU,
      isSuppressed: medianOvertimePayDiffU === null
    });

    return calculatedAmounts;
  },

  /*
  Calculated gaps are given as a difference in mean overtime hours between 
  each gender group and the reference group
  */
  calculateMeanOvertimeHoursGaps(overtimeHoursStats: ColumnStats): CalculatedAmount[] {
    const refGenderCode = overtimeHoursStats.getReferenceGenderCode();

    let meanOvertimeHoursDiffM = null;
    let meanOvertimeHoursDiffF = null;
    let meanOvertimeHoursDiffX = null;
    let meanOvertimeHoursDiffU = null;

    if (refGenderCode) {
      const meanOvertimeHoursRef = overtimeHoursStats.getMean(refGenderCode);
      if (!overtimeHoursStats.isSuppressed(GENDER_CODES.MALE[0])) {
        meanOvertimeHoursDiffM =
          (meanOvertimeHoursRef - overtimeHoursStats.getMean(GENDER_CODES.MALE[0]));
      }
      if (!overtimeHoursStats.isSuppressed(GENDER_CODES.FEMALE[0])) {
        meanOvertimeHoursDiffF =
          (meanOvertimeHoursRef - overtimeHoursStats.getMean(GENDER_CODES.FEMALE[0]));
      }
      if (!overtimeHoursStats.isSuppressed(GENDER_CODES.NON_BINARY[0])) {
        meanOvertimeHoursDiffX =
          (meanOvertimeHoursRef - overtimeHoursStats.getMean(GENDER_CODES.NON_BINARY[0]));
      }
      if (!overtimeHoursStats.isSuppressed(GENDER_CODES.UNKNOWN[0])) {
        meanOvertimeHoursDiffU =
          (meanOvertimeHoursRef - overtimeHoursStats.getMean(GENDER_CODES.UNKNOWN[0]));
      }
    }

    const calculatedAmounts = [];
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEAN_OT_HOURS_DIFF_M,
      value: meanOvertimeHoursDiffM,
      isSuppressed: meanOvertimeHoursDiffM === null
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEAN_OT_HOURS_DIFF_W,
      value: meanOvertimeHoursDiffF,
      isSuppressed: meanOvertimeHoursDiffF === null
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEAN_OT_HOURS_DIFF_X,
      value: meanOvertimeHoursDiffX,
      isSuppressed: meanOvertimeHoursDiffX === null
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEAN_OT_HOURS_DIFF_U,
      value: meanOvertimeHoursDiffU,
      isSuppressed: meanOvertimeHoursDiffU === null
    });

    return calculatedAmounts;
  },

  /*
  Calculated gaps are given as a difference in median overtime hours between 
  each gender group and the reference group
  */
  calculateMedianOvertimeHoursGaps(overtimeHoursStats: ColumnStats): CalculatedAmount[] {
    const refGenderCode = overtimeHoursStats.getReferenceGenderCode();

    let medianOvertimeHoursDiffM = null;
    let medianOvertimeHoursDiffF = null;
    let medianOvertimeHoursDiffX = null;
    let medianOvertimeHoursDiffU = null;

    if (refGenderCode) {
      const medianOvertimeHoursRef = overtimeHoursStats.getMedian(refGenderCode);
      if (!overtimeHoursStats.isSuppressed(GENDER_CODES.MALE[0])) {
        medianOvertimeHoursDiffM =
          (medianOvertimeHoursRef - overtimeHoursStats.getMedian(GENDER_CODES.MALE[0]));
      }
      if (!overtimeHoursStats.isSuppressed(GENDER_CODES.FEMALE[0])) {
        medianOvertimeHoursDiffF =
          (medianOvertimeHoursRef - overtimeHoursStats.getMedian(GENDER_CODES.FEMALE[0]));
      }
      if (!overtimeHoursStats.isSuppressed(GENDER_CODES.NON_BINARY[0])) {
        medianOvertimeHoursDiffX =
          (medianOvertimeHoursRef - overtimeHoursStats.getMedian(GENDER_CODES.NON_BINARY[0]));
      }
      if (!overtimeHoursStats.isSuppressed(GENDER_CODES.UNKNOWN[0])) {
        medianOvertimeHoursDiffU =
          (medianOvertimeHoursRef - overtimeHoursStats.getMedian(GENDER_CODES.UNKNOWN[0]));
      }
    }

    const calculatedAmounts = [];
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEDIAN_OT_HOURS_DIFF_M,
      value: medianOvertimeHoursDiffM,
      isSuppressed: medianOvertimeHoursDiffM === null
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEDIAN_OT_HOURS_DIFF_W,
      value: medianOvertimeHoursDiffF,
      isSuppressed: medianOvertimeHoursDiffF === null
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEDIAN_OT_HOURS_DIFF_X,
      value: medianOvertimeHoursDiffX,
      isSuppressed: medianOvertimeHoursDiffX === null
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEDIAN_OT_HOURS_DIFF_U,
      value: medianOvertimeHoursDiffU,
      isSuppressed: medianOvertimeHoursDiffU === null
    });

    return calculatedAmounts;
  },

  calculateMeanBonusPayGaps(bonusPayStats: ColumnStats): CalculatedAmount[] {
    const refGenderCode = bonusPayStats.getReferenceGenderCode();

    let meanBonusPayDiffM = null;
    let meanBonusPayDiffF = null;
    let meanBonusPayDiffX = null;
    let meanBonusPayDiffU = null;

    if (refGenderCode) {
      const meanBonusPayRef = bonusPayStats.getMean(refGenderCode);
      if (!bonusPayStats.isSuppressed(GENDER_CODES.MALE[0])) {
        meanBonusPayDiffM =
          (meanBonusPayRef - bonusPayStats.getMean(GENDER_CODES.MALE[0])) /
          meanBonusPayRef;
      }
      if (!bonusPayStats.isSuppressed(GENDER_CODES.FEMALE[0])) {
        meanBonusPayDiffF =
          (meanBonusPayRef - bonusPayStats.getMean(GENDER_CODES.FEMALE[0])) /
          meanBonusPayRef;
      }
      if (!bonusPayStats.isSuppressed(GENDER_CODES.NON_BINARY[0])) {
        meanBonusPayDiffX =
          (meanBonusPayRef - bonusPayStats.getMean(GENDER_CODES.NON_BINARY[0])) /
          meanBonusPayRef;
      }
      if (!bonusPayStats.isSuppressed(GENDER_CODES.UNKNOWN[0])) {
        meanBonusPayDiffU =
          (meanBonusPayRef - bonusPayStats.getMean(GENDER_CODES.UNKNOWN[0])) /
          meanBonusPayRef;
      }
    }

    const calculatedAmounts = [];
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEAN_BONUS_PAY_DIFF_M,
      value: meanBonusPayDiffM,
      isSuppressed: meanBonusPayDiffM === null
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEAN_BONUS_PAY_DIFF_W,
      value: meanBonusPayDiffF,
      isSuppressed: meanBonusPayDiffF === null
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEAN_BONUS_PAY_DIFF_X,
      value: meanBonusPayDiffX,
      isSuppressed: meanBonusPayDiffX === null
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEAN_BONUS_PAY_DIFF_U,
      value: meanBonusPayDiffU,
      isSuppressed: meanBonusPayDiffU === null
    });

    return calculatedAmounts;
  },

  calculateMedianBonusPayGaps(bonusPayStats: ColumnStats): CalculatedAmount[] {
    const refGenderCode = bonusPayStats.getReferenceGenderCode();

    let medianBonusPayDiffM = null;
    let medianBonusPayDiffF = null;
    let medianBonusPayDiffX = null;
    let medianBonusPayDiffU = null;

    if (refGenderCode) {
      const medianBonusPayRef = bonusPayStats.getMedian(refGenderCode);
      if (!bonusPayStats.isSuppressed(GENDER_CODES.MALE[0])) {
        medianBonusPayDiffM =
          (medianBonusPayRef - bonusPayStats.getMedian(GENDER_CODES.MALE[0])) /
          medianBonusPayRef;
      }
      if (!bonusPayStats.isSuppressed(GENDER_CODES.FEMALE[0])) {
        medianBonusPayDiffF =
          (medianBonusPayRef - bonusPayStats.getMedian(GENDER_CODES.FEMALE[0])) /
          medianBonusPayRef;
      }
      if (!bonusPayStats.isSuppressed(GENDER_CODES.NON_BINARY[0])) {
        medianBonusPayDiffX =
          (medianBonusPayRef - bonusPayStats.getMedian(GENDER_CODES.NON_BINARY[0])) /
          medianBonusPayRef;
      }
      if (!bonusPayStats.isSuppressed(GENDER_CODES.UNKNOWN[0])) {
        medianBonusPayDiffU =
          (medianBonusPayRef - bonusPayStats.getMedian(GENDER_CODES.UNKNOWN[0])) /
          medianBonusPayRef;
      }
    }

    const calculatedAmounts = [];
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEDIAN_BONUS_PAY_DIFF_M,
      value: medianBonusPayDiffM,
      isSuppressed: medianBonusPayDiffM === null
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEDIAN_BONUS_PAY_DIFF_W,
      value: medianBonusPayDiffF,
      isSuppressed: medianBonusPayDiffF === null
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEDIAN_BONUS_PAY_DIFF_X,
      value: medianBonusPayDiffX,
      isSuppressed: medianBonusPayDiffX === null
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEDIAN_BONUS_PAY_DIFF_U,
      value: medianBonusPayDiffU,
      isSuppressed: medianBonusPayDiffU === null
    });

    return calculatedAmounts;
  },

  /* 
    Modifies the given csvRecord object so that it is ready for 
    calculations to be performed against its contents.  The following
    cleanup steps are applied:
    - for all columns that allow numeric values:
       - converts blanks to zeros  
       - parse strings as numbers         
    Assumes the given csvRecord has already passed validation. 
    (Behaviour is undefined if this isn't the case.)
    Returns the modified object.
    */
  cleanCsvRecord(csvRecord: any): any {
    Object.keys(csvRecord).forEach(col => {
      if (NUMERIC_COLUMNS.indexOf(col) >= 0) {
        if (validateService.isZeroSynonym(csvRecord[col])) {
          csvRecord[col] = 0;
        }
        else {
          csvRecord[col] = parseFloat(csvRecord[col]);
        }
      }
    })
    return csvRecord;
  },

  /* Given a parsed csvRecord (represented as an object with column 
    names as keys), determine the hourly pay (in dollars).  This 
    involves either calculating the hourly pay from ordinary (annual) pay
    and hours worked, or from special salary (which is an hourly amount).
    Assumes the clean() function has been previously called on the 
    csvRecord. (Behaviour is undefined if this isn't the case.)
    */
  getHourlyPayDollars(csvRecord: any): number {
    if (!csvRecord) {
      throw new Error("csvRecord must be specified");
    }
    if (csvRecord[CSV_COLUMNS.ORDINARY_PAY] && csvRecord[CSV_COLUMNS.HOURS_WORKED]) {
      return csvRecord[CSV_COLUMNS.ORDINARY_PAY] / csvRecord[CSV_COLUMNS.HOURS_WORKED];
    }
    return csvRecord[CSV_COLUMNS.SPECIAL_SALARY];
  }
}

export { CALCULATION_CODES, CalculatedAmount, ColumnStats, reportCalcService, reportCalcServicePrivate };

