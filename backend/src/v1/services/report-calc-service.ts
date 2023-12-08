import { parse } from 'csv-parse';
import { Readable } from 'stream';
import { CSV_COLUMNS, GENDER_CODES, NUMERIC_COLUMNS, validateService } from './validate-service';


const CALCULATION_KEYS = {
  MEAN_HOURLY_PAY_DIFF_F: "MEAN_HOURLY_PAY_DIFF_F",
  MEAN_HOURLY_PAY_DIFF_X: "MEAN_HOURLY_PAY_DIFF_X",
  MEAN_HOURLY_PAY_DIFF_U: "MEAN_HOURLY_PAY_DIFF_U",
  MEDIAN_HOURLY_PAY_DIFF_F: "MEAN_HOURLY_PAY_DIFF_F",
  MEDIAN_HOURLY_PAY_DIFF_X: "MEAN_HOURLY_PAY_DIFF_X",
  MEDIAN_HOURLY_PAY_DIFF_U: "MEAN_HOURLY_PAY_DIFF_U",
}

interface CalculatedAmount {
  key: string,
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
    Object.values(ColumnStats.REF_CATEGORY_PREFERENCE).forEach((genderCodeSynonyms: string[]) => {
      // Arbitrarily pick any one value from the list
      // of synonyms for this gender category
      const genderCode = genderCodeSynonyms[0];

      const numPeopleInGenderCategory = this.getCount(genderCode);
      if (numPeopleInGenderCategory >= ColumnStats.MIN_REQUIRED_COUNT_FOR_REF_CATEGORY) {
        referenceGenderCode = genderCode;
        //break out of forEach loop
        return;
      }
    });
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

    const hourlyPayStats = new ColumnStats();

    for await (const csvRecord of csvParser) {
      this.cleanCsvRecord(csvRecord);
      const hourlyPayDollars = reportCalcServicePrivate.getHourlyPayDollars(csvRecord);
      hourlyPayStats.push(hourlyPayDollars, csvRecord[CSV_COLUMNS.GENDER_CODE]);
    }

    calculatedAmounts.push(...reportCalcServicePrivate.calculateMeanHourlyPayGaps(hourlyPayStats));
    calculatedAmounts.push(...reportCalcServicePrivate.calculateMedianHourlyPayGaps(hourlyPayStats));

    return calculatedAmounts;
  },

}

const reportCalcServicePrivate = {

  calculateMeanHourlyPayGaps(hourlyPayStats: ColumnStats): CalculatedAmount[] {
    const refGenderCode = hourlyPayStats.getReferenceGenderCode();

    let meanHourlyPayDiffF = null;
    let meanHourlyPayDiffX = null;
    let meanHourlyPayDiffU = null;

    if (refGenderCode) {
      const meanHourlyPayRef = hourlyPayStats.getMean(refGenderCode);
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
      key: CALCULATION_KEYS.MEAN_HOURLY_PAY_DIFF_F,
      value: meanHourlyPayDiffF,
      isSuppressed: meanHourlyPayDiffF !== null
    });
    calculatedAmounts.push({
      key: CALCULATION_KEYS.MEAN_HOURLY_PAY_DIFF_X,
      value: meanHourlyPayDiffX,
      isSuppressed: meanHourlyPayDiffX !== null
    });
    calculatedAmounts.push({
      key: CALCULATION_KEYS.MEAN_HOURLY_PAY_DIFF_U,
      value: meanHourlyPayDiffU,
      isSuppressed: meanHourlyPayDiffU !== null
    });

    return calculatedAmounts;
  },

  calculateMedianHourlyPayGaps(hourlyPayStats: ColumnStats): CalculatedAmount[] {
    const refGenderCode = hourlyPayStats.getReferenceGenderCode();

    let medianHourlyPayDiffF = null;
    let medianHourlyPayDiffX = null;
    let medianHourlyPayDiffU = null;

    if (refGenderCode) {
      const meanHourlyPayRef = hourlyPayStats.getMean(refGenderCode);
      if (!hourlyPayStats.isSuppressed(GENDER_CODES.FEMALE[0])) {
        medianHourlyPayDiffF =
          (meanHourlyPayRef - hourlyPayStats.getMean(GENDER_CODES.FEMALE[0])) /
          meanHourlyPayRef;
      }
      if (!hourlyPayStats.isSuppressed(GENDER_CODES.NON_BINARY[0])) {
        medianHourlyPayDiffX =
          (meanHourlyPayRef - hourlyPayStats.getMean(GENDER_CODES.NON_BINARY[0])) /
          meanHourlyPayRef;
      }
      if (!hourlyPayStats.isSuppressed(GENDER_CODES.UNKNOWN[0])) {
        medianHourlyPayDiffU =
          (meanHourlyPayRef - hourlyPayStats.getMean(GENDER_CODES.UNKNOWN[0])) /
          meanHourlyPayRef;
      }
    }

    const calculatedAmounts = [];
    calculatedAmounts.push({
      key: CALCULATION_KEYS.MEDIAN_HOURLY_PAY_DIFF_F,
      value: medianHourlyPayDiffF,
      isSuppressed: medianHourlyPayDiffF !== null
    });
    calculatedAmounts.push({
      key: CALCULATION_KEYS.MEDIAN_HOURLY_PAY_DIFF_X,
      value: medianHourlyPayDiffX,
      isSuppressed: medianHourlyPayDiffX !== null
    });
    calculatedAmounts.push({
      key: CALCULATION_KEYS.MEDIAN_HOURLY_PAY_DIFF_U,
      value: medianHourlyPayDiffU,
      isSuppressed: medianHourlyPayDiffU !== null
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
    involves either calculating the hourly pay from regular (annual) pay
    and regular hours worked, or from special salary
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
    return csvRecord[CSV_COLUMNS.ORDINARY_PAY];
  }
}

export { CalculatedAmount, ColumnStats, reportCalcService, reportCalcServicePrivate };

