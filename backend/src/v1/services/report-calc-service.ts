import { parse } from 'csv-parse';
import { Readable } from 'stream';
import { logger } from '../../logger';
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
class GroupedColumnStats {
  static REF_CATEGORY_PREFERENCE = [GENDER_CODES.MALE, GENDER_CODES.UNKNOWN, GENDER_CODES.NON_BINARY];


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
    const genderCategories = Object.values(GroupedColumnStats.REF_CATEGORY_PREFERENCE);
    for (let genderCodeSynonyms of genderCategories) {

      // Arbitrarily pick any one value from the list
      // of synonyms for this gender category
      const genderCode = genderCodeSynonyms[0];

      const numPeopleInGenderCategory = this.getCount(genderCode);
      if (numPeopleInGenderCategory >= reportCalcService.MIN_REQUIRED_COUNT_FOR_REF_CATEGORY) {
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
  Returns a count of people in the given gender category who have 
  a non-zero data value for the measurement represented by this GroupedColumnStats
  object
  */
  getCountWithNonZeroData(genderCode: string) {
    const valuesWithData = this.getValues(genderCode)
      .filter(d => !validateService.isZeroSynonym(d));
    return valuesWithData.length;
  }

  /* 
    Calculate and return the mean (average) from the array of values
    associated with the given genderCode 
    @param omitZeros: flag to request that zeros are excluded from
    the calculation of the mean.  
    */
  getMean(genderCode: string, omitZeros: boolean = false) {
    let values = this.getValues(genderCode);
    if (omitZeros) {
      values = values.filter(v => v != 0);
    }
    const sum = values.reduce(
      (accumulator, v) => accumulator + v,
      0,
    );
    const count = values.length;
    const avg = count != 0 ?
      sum / count :
      0;
    return avg;
  }

  /* 
    Calculate and return the median from the array of values
    associated with the given genderCode
    @param omitZeros: flag to request that zeros are excluded from
    the calculation of the median.  
   */
  getMedian(genderCode: string, omitZeros: boolean = false) {
    // The logic in this function relies on the array of values for
    // a given genderCode being sorted.  Sort now to be sure.
    this.sortEachGenderCategory();

    let values = this.getValues(genderCode);
    if (omitZeros) {
      values = values.filter(v => v != 0);
    }
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

  MIN_REQUIRED_COUNT_FOR_REF_CATEGORY: 10,
  MIN_REQUIRED_PEOPLE_COUNT: 10,
  MIN_REQUIRED_PEOPLE_WITH_DATA_COUNT: 10,

  /*
    Scans the entire CSV file and calculates all the amounts needed for the report.
    Returns an array of all the CalculatedAmounts.
  */
  async calculateAll(csvReadable: Readable): Promise<CalculatedAmount[]> {
    logger.debug(`Calculating all amounts for report started.`);
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
    const hourlyPayStats = new GroupedColumnStats();
    const overtimePayStats = new GroupedColumnStats();
    const overtimeHoursStats = new GroupedColumnStats();
    const bonusPayStats = new GroupedColumnStats();

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

    // Although not technically a calculation, include the reference gender category
    // code in the list of CalculatedAmounts.
    // Note: the reference gender category is never suppressed
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.REFERENCE_GENDER_CATEGORY_CODE,
      value: hourlyPayStats.getReferenceGenderCode(),
      isSuppressed: false
    });
    logger.debug(`Calculating all amounts for report finished.`);
    return calculatedAmounts;
  },

}

const reportCalcServicePrivate = {

  meetsPeopleCountThreshold(columnStats: GroupedColumnStats, genderCode: string) {
    const count = columnStats.getCount(genderCode);
    return count >= reportCalcService.MIN_REQUIRED_PEOPLE_COUNT;
  },

  meetsPeopleWithDataCountThreshold(columnStats: GroupedColumnStats, genderCode: string) {
    const count = columnStats.getCountWithNonZeroData(genderCode);
    return count >= reportCalcService.MIN_REQUIRED_PEOPLE_WITH_DATA_COUNT;
  },

  calculateMeanHourlyPayGaps(hourlyPayStats: GroupedColumnStats): CalculatedAmount[] {
    const refGenderCode = hourlyPayStats.getReferenceGenderCode();

    let meanHourlyPayDiffM = null;
    let meanHourlyPayDiffF = null;
    let meanHourlyPayDiffX = null;
    let meanHourlyPayDiffU = null;

    //only 
    if (refGenderCode && this.meetsPeopleWithDataCountThreshold(hourlyPayStats, refGenderCode)) {
      const meanHourlyPayRef = hourlyPayStats.getMean(refGenderCode, true);
      if (this.meetsPeopleCountThreshold(hourlyPayStats, GENDER_CODES.MALE[0])) {
        meanHourlyPayDiffM =
          (meanHourlyPayRef - hourlyPayStats.getMean(GENDER_CODES.MALE[0], true)) /
          meanHourlyPayRef * 100;
      }
      if (this.meetsPeopleCountThreshold(hourlyPayStats, GENDER_CODES.FEMALE[0])) {
        meanHourlyPayDiffF =
          (meanHourlyPayRef - hourlyPayStats.getMean(GENDER_CODES.FEMALE[0], true)) /
          meanHourlyPayRef * 100;
      }
      if (this.meetsPeopleCountThreshold(hourlyPayStats, GENDER_CODES.NON_BINARY[0])) {
        meanHourlyPayDiffX =
          (meanHourlyPayRef - hourlyPayStats.getMean(GENDER_CODES.NON_BINARY[0], true)) /
          meanHourlyPayRef * 100;
      }
      if (this.meetsPeopleCountThreshold(hourlyPayStats, GENDER_CODES.UNKNOWN[0])) {
        meanHourlyPayDiffU =
          (meanHourlyPayRef - hourlyPayStats.getMean(GENDER_CODES.UNKNOWN[0], true)) /
          meanHourlyPayRef * 100;
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

  calculateMedianHourlyPayGaps(hourlyPayStats: GroupedColumnStats): CalculatedAmount[] {
    const refGenderCode = hourlyPayStats.getReferenceGenderCode();

    let medianHourlyPayDiffM = null;
    let medianHourlyPayDiffF = null;
    let medianHourlyPayDiffX = null;
    let medianHourlyPayDiffU = null;

    if (refGenderCode && this.meetsPeopleWithDataCountThreshold(hourlyPayStats, refGenderCode)) {
      const medianHourlyPayRef = hourlyPayStats.getMedian(refGenderCode, true);
      if (this.meetsPeopleCountThreshold(hourlyPayStats, GENDER_CODES.MALE[0])) {
        medianHourlyPayDiffM =
          (medianHourlyPayRef - hourlyPayStats.getMedian(GENDER_CODES.MALE[0], true)) /
          medianHourlyPayRef * 100;
      }
      if (this.meetsPeopleCountThreshold(hourlyPayStats, GENDER_CODES.FEMALE[0])) {
        medianHourlyPayDiffF =
          (medianHourlyPayRef - hourlyPayStats.getMedian(GENDER_CODES.FEMALE[0], true)) /
          medianHourlyPayRef * 100;
      }
      if (this.meetsPeopleCountThreshold(hourlyPayStats, GENDER_CODES.NON_BINARY[0])) {
        medianHourlyPayDiffX =
          (medianHourlyPayRef - hourlyPayStats.getMedian(GENDER_CODES.NON_BINARY[0], true)) /
          medianHourlyPayRef * 100;
      }
      if (this.meetsPeopleCountThreshold(hourlyPayStats, GENDER_CODES.UNKNOWN[0])) {
        medianHourlyPayDiffU =
          (medianHourlyPayRef - hourlyPayStats.getMedian(GENDER_CODES.UNKNOWN[0], true)) /
          medianHourlyPayRef * 100;
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

  calculateMeanOvertimePayGaps(overtimePayStats: GroupedColumnStats): CalculatedAmount[] {
    const refGenderCode = overtimePayStats.getReferenceGenderCode();

    let meanOvertimePayDiffM = null;
    let meanOvertimePayDiffF = null;
    let meanOvertimePayDiffX = null;
    let meanOvertimePayDiffU = null;

    if (refGenderCode && this.meetsPeopleWithDataCountThreshold(overtimePayStats, refGenderCode)) {
      const meanOvertimePayRef = overtimePayStats.getMean(refGenderCode, true);
      if (this.meetsPeopleCountThreshold(overtimePayStats, GENDER_CODES.MALE[0])) {
        meanOvertimePayDiffM =
          (meanOvertimePayRef - overtimePayStats.getMean(GENDER_CODES.MALE[0], true)) /
          meanOvertimePayRef * 100;
      }
      if (this.meetsPeopleCountThreshold(overtimePayStats, GENDER_CODES.FEMALE[0])) {
        meanOvertimePayDiffF =
          (meanOvertimePayRef - overtimePayStats.getMean(GENDER_CODES.FEMALE[0], true)) /
          meanOvertimePayRef * 100;
      }
      if (this.meetsPeopleCountThreshold(overtimePayStats, GENDER_CODES.NON_BINARY[0])) {
        meanOvertimePayDiffX =
          (meanOvertimePayRef - overtimePayStats.getMean(GENDER_CODES.NON_BINARY[0], true)) /
          meanOvertimePayRef * 100;
      }
      if (this.meetsPeopleCountThreshold(overtimePayStats, GENDER_CODES.UNKNOWN[0])) {
        meanOvertimePayDiffU =
          (meanOvertimePayRef - overtimePayStats.getMean(GENDER_CODES.UNKNOWN[0], true)) /
          meanOvertimePayRef * 100;
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

  calculateMedianOvertimePayGaps(overtimePayStats: GroupedColumnStats): CalculatedAmount[] {
    const refGenderCode = overtimePayStats.getReferenceGenderCode();

    let medianOvertimePayDiffM = null;
    let medianOvertimePayDiffF = null;
    let medianOvertimePayDiffX = null;
    let medianOvertimePayDiffU = null;

    if (refGenderCode && this.meetsPeopleWithDataCountThreshold(overtimePayStats, refGenderCode)) {
      const medianOvertimePayRef = overtimePayStats.getMedian(refGenderCode, true);
      if (this.meetsPeopleCountThreshold(overtimePayStats, GENDER_CODES.MALE[0])) {
        medianOvertimePayDiffM =
          (medianOvertimePayRef - overtimePayStats.getMedian(GENDER_CODES.MALE[0], true)) /
          medianOvertimePayRef * 100;
      }
      if (this.meetsPeopleCountThreshold(overtimePayStats, GENDER_CODES.FEMALE[0])) {
        medianOvertimePayDiffF =
          (medianOvertimePayRef - overtimePayStats.getMedian(GENDER_CODES.FEMALE[0], true)) /
          medianOvertimePayRef * 100;
      }
      if (this.meetsPeopleCountThreshold(overtimePayStats, GENDER_CODES.NON_BINARY[0])) {
        medianOvertimePayDiffX =
          (medianOvertimePayRef - overtimePayStats.getMedian(GENDER_CODES.NON_BINARY[0], true)) /
          medianOvertimePayRef * 100;
      }
      if (this.meetsPeopleCountThreshold(overtimePayStats, GENDER_CODES.UNKNOWN[0])) {
        medianOvertimePayDiffU =
          (medianOvertimePayRef - overtimePayStats.getMedian(GENDER_CODES.UNKNOWN[0], true)) /
          medianOvertimePayRef * 100;
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
  calculateMeanOvertimeHoursGaps(overtimeHoursStats: GroupedColumnStats): CalculatedAmount[] {
    const refGenderCode = overtimeHoursStats.getReferenceGenderCode();

    let meanOvertimeHoursDiffM = null;
    let meanOvertimeHoursDiffF = null;
    let meanOvertimeHoursDiffX = null;
    let meanOvertimeHoursDiffU = null;

    if (refGenderCode && this.meetsPeopleWithDataCountThreshold(overtimeHoursStats, refGenderCode)) {
      const meanOvertimeHoursRef = overtimeHoursStats.getMean(refGenderCode, true);
      if (this.meetsPeopleCountThreshold(overtimeHoursStats, GENDER_CODES.MALE[0])) {
        meanOvertimeHoursDiffM =
          (overtimeHoursStats.getMean(GENDER_CODES.MALE[0], true) - meanOvertimeHoursRef);
      }
      if (this.meetsPeopleCountThreshold(overtimeHoursStats, GENDER_CODES.FEMALE[0])) {
        meanOvertimeHoursDiffF =
          (overtimeHoursStats.getMean(GENDER_CODES.FEMALE[0], true) - meanOvertimeHoursRef);
      }
      if (this.meetsPeopleCountThreshold(overtimeHoursStats, GENDER_CODES.NON_BINARY[0])) {
        meanOvertimeHoursDiffX =
          (overtimeHoursStats.getMean(GENDER_CODES.NON_BINARY[0], true) - meanOvertimeHoursRef);
      }
      if (this.meetsPeopleCountThreshold(overtimeHoursStats, GENDER_CODES.UNKNOWN[0])) {
        meanOvertimeHoursDiffU =
          (overtimeHoursStats.getMean(GENDER_CODES.UNKNOWN[0], true) - meanOvertimeHoursRef);
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
  calculateMedianOvertimeHoursGaps(overtimeHoursStats: GroupedColumnStats): CalculatedAmount[] {
    const refGenderCode = overtimeHoursStats.getReferenceGenderCode();

    let medianOvertimeHoursDiffM = null;
    let medianOvertimeHoursDiffF = null;
    let medianOvertimeHoursDiffX = null;
    let medianOvertimeHoursDiffU = null;

    if (refGenderCode && this.meetsPeopleWithDataCountThreshold(overtimeHoursStats, refGenderCode)) {
      const medianOvertimeHoursRef = overtimeHoursStats.getMedian(refGenderCode, true);
      if (this.meetsPeopleCountThreshold(overtimeHoursStats, GENDER_CODES.MALE[0])) {
        medianOvertimeHoursDiffM =
          (overtimeHoursStats.getMedian(GENDER_CODES.MALE[0], true) - medianOvertimeHoursRef);
      }
      if (this.meetsPeopleCountThreshold(overtimeHoursStats, GENDER_CODES.FEMALE[0])) {
        medianOvertimeHoursDiffF =
          (overtimeHoursStats.getMedian(GENDER_CODES.FEMALE[0], true) - medianOvertimeHoursRef);
      }
      if (this.meetsPeopleCountThreshold(overtimeHoursStats, GENDER_CODES.NON_BINARY[0])) {
        medianOvertimeHoursDiffX =
          (overtimeHoursStats.getMedian(GENDER_CODES.NON_BINARY[0], true) - medianOvertimeHoursRef);
      }
      if (this.meetsPeopleCountThreshold(overtimeHoursStats, GENDER_CODES.UNKNOWN[0])) {
        medianOvertimeHoursDiffU =
          (overtimeHoursStats.getMedian(GENDER_CODES.UNKNOWN[0], true) - medianOvertimeHoursRef);
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

  calculateMeanBonusPayGaps(bonusPayStats: GroupedColumnStats): CalculatedAmount[] {
    const refGenderCode = bonusPayStats.getReferenceGenderCode();

    let meanBonusPayDiffM = null;
    let meanBonusPayDiffF = null;
    let meanBonusPayDiffX = null;
    let meanBonusPayDiffU = null;

    if (refGenderCode && this.meetsPeopleWithDataCountThreshold(bonusPayStats, refGenderCode)) {
      const meanBonusPayRef = bonusPayStats.getMean(refGenderCode, true);
      if (this.meetsPeopleCountThreshold(bonusPayStats, GENDER_CODES.MALE[0])) {
        meanBonusPayDiffM =
          (meanBonusPayRef - bonusPayStats.getMean(GENDER_CODES.MALE[0], true)) /
          meanBonusPayRef * 100;
      }
      if (this.meetsPeopleCountThreshold(bonusPayStats, GENDER_CODES.FEMALE[0])) {
        meanBonusPayDiffF =
          (meanBonusPayRef - bonusPayStats.getMean(GENDER_CODES.FEMALE[0], true)) /
          meanBonusPayRef * 100;
      }
      if (this.meetsPeopleCountThreshold(bonusPayStats, GENDER_CODES.NON_BINARY[0])) {
        meanBonusPayDiffX =
          (meanBonusPayRef - bonusPayStats.getMean(GENDER_CODES.NON_BINARY[0], true)) /
          meanBonusPayRef * 100;
      }
      if (this.meetsPeopleCountThreshold(bonusPayStats, GENDER_CODES.UNKNOWN[0])) {
        meanBonusPayDiffU =
          (meanBonusPayRef - bonusPayStats.getMean(GENDER_CODES.UNKNOWN[0], true)) /
          meanBonusPayRef * 100;
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

  calculateMedianBonusPayGaps(bonusPayStats: GroupedColumnStats): CalculatedAmount[] {
    const refGenderCode = bonusPayStats.getReferenceGenderCode();

    let medianBonusPayDiffM = null;
    let medianBonusPayDiffF = null;
    let medianBonusPayDiffX = null;
    let medianBonusPayDiffU = null;

    if (refGenderCode && this.meetsPeopleWithDataCountThreshold(bonusPayStats, refGenderCode)) {
      const medianBonusPayRef = bonusPayStats.getMedian(refGenderCode, true);
      if (this.meetsPeopleCountThreshold(bonusPayStats, GENDER_CODES.MALE[0])) {
        medianBonusPayDiffM =
          (medianBonusPayRef - bonusPayStats.getMedian(GENDER_CODES.MALE[0], true)) /
          medianBonusPayRef * 100;
      }
      if (this.meetsPeopleCountThreshold(bonusPayStats, GENDER_CODES.FEMALE[0])) {
        medianBonusPayDiffF =
          (medianBonusPayRef - bonusPayStats.getMedian(GENDER_CODES.FEMALE[0], true)) /
          medianBonusPayRef * 100;
      }
      if (this.meetsPeopleCountThreshold(bonusPayStats, GENDER_CODES.NON_BINARY[0])) {
        medianBonusPayDiffX =
          (medianBonusPayRef - bonusPayStats.getMedian(GENDER_CODES.NON_BINARY[0], true)) /
          medianBonusPayRef * 100;
      }
      if (this.meetsPeopleCountThreshold(bonusPayStats, GENDER_CODES.UNKNOWN[0])) {
        medianBonusPayDiffU =
          (medianBonusPayRef - bonusPayStats.getMedian(GENDER_CODES.UNKNOWN[0], true)) /
          medianBonusPayRef * 100;
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

export { CALCULATION_CODES, CalculatedAmount, GroupedColumnStats, reportCalcService, reportCalcServicePrivate };

