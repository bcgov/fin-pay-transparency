import { logger } from '../../logger';
import {
  GENDER_CODES,
  NUMERIC_COLUMNS,
  RowError,
  STANDARDIZED_GENDER_CODES,
  SUBMISSION_ROW_COLUMNS,
  validateService,
  ValidationError,
} from './validate-service';

const CALCULATION_CODES = {
  REFERENCE_GENDER_CATEGORY_CODE: 'REFERENCE_GENDER_CATEGORY_CODE',
  MEAN_HOURLY_PAY_DIFF_M: 'MEAN_HOURLY_PAY_DIFF_M',
  MEAN_HOURLY_PAY_DIFF_W: 'MEAN_HOURLY_PAY_DIFF_W',
  MEAN_HOURLY_PAY_DIFF_X: 'MEAN_HOURLY_PAY_DIFF_X',
  MEAN_HOURLY_PAY_DIFF_U: 'MEAN_HOURLY_PAY_DIFF_U',
  MEDIAN_HOURLY_PAY_DIFF_M: 'MEDIAN_HOURLY_PAY_DIFF_M',
  MEDIAN_HOURLY_PAY_DIFF_W: 'MEDIAN_HOURLY_PAY_DIFF_W',
  MEDIAN_HOURLY_PAY_DIFF_X: 'MEDIAN_HOURLY_PAY_DIFF_X',
  MEDIAN_HOURLY_PAY_DIFF_U: 'MEDIAN_HOURLY_PAY_DIFF_U',
  MEAN_OT_PAY_DIFF_M: 'MEAN_OT_PAY_DIFF_M',
  MEAN_OT_PAY_DIFF_W: 'MEAN_OT_PAY_DIFF_W',
  MEAN_OT_PAY_DIFF_X: 'MEAN_OT_PAY_DIFF_X',
  MEAN_OT_PAY_DIFF_U: 'MEAN_OT_PAY_DIFF_U',
  MEDIAN_OT_PAY_DIFF_M: 'MEDIAN_OT_PAY_DIFF_M',
  MEDIAN_OT_PAY_DIFF_W: 'MEDIAN_OT_PAY_DIFF_W',
  MEDIAN_OT_PAY_DIFF_X: 'MEDIAN_OT_PAY_DIFF_X',
  MEDIAN_OT_PAY_DIFF_U: 'MEDIAN_OT_PAY_DIFF_U',
  MEAN_OT_HOURS_DIFF_M: 'MEAN_OT_HOURS_DIFF_M',
  MEAN_OT_HOURS_DIFF_W: 'MEAN_OT_HOURS_DIFF_W',
  MEAN_OT_HOURS_DIFF_X: 'MEAN_OT_HOURS_DIFF_X',
  MEAN_OT_HOURS_DIFF_U: 'MEAN_OT_HOURS_DIFF_U',
  MEDIAN_OT_HOURS_DIFF_M: 'MEDIAN_OT_HOURS_DIFF_M',
  MEDIAN_OT_HOURS_DIFF_W: 'MEDIAN_OT_HOURS_DIFF_W',
  MEDIAN_OT_HOURS_DIFF_X: 'MEDIAN_OT_HOURS_DIFF_X',
  MEDIAN_OT_HOURS_DIFF_U: 'MEDIAN_OT_HOURS_DIFF_U',
  MEAN_BONUS_PAY_DIFF_M: 'MEAN_BONUS_PAY_DIFF_M',
  MEAN_BONUS_PAY_DIFF_W: 'MEAN_BONUS_PAY_DIFF_W',
  MEAN_BONUS_PAY_DIFF_X: 'MEAN_BONUS_PAY_DIFF_X',
  MEAN_BONUS_PAY_DIFF_U: 'MEAN_BONUS_PAY_DIFF_U',
  MEDIAN_BONUS_PAY_DIFF_M: 'MEDIAN_BONUS_PAY_DIFF_M',
  MEDIAN_BONUS_PAY_DIFF_W: 'MEDIAN_BONUS_PAY_DIFF_W',
  MEDIAN_BONUS_PAY_DIFF_X: 'MEDIAN_BONUS_PAY_DIFF_X',
  MEDIAN_BONUS_PAY_DIFF_U: 'MEDIAN_BONUS_PAY_DIFF_U',
  HOURLY_PAY_PERCENT_QUARTILE_1_M: 'HOURLY_PAY_PERCENT_QUARTILE_1_M',
  HOURLY_PAY_PERCENT_QUARTILE_1_W: 'HOURLY_PAY_PERCENT_QUARTILE_1_W',
  HOURLY_PAY_PERCENT_QUARTILE_1_X: 'HOURLY_PAY_PERCENT_QUARTILE_1_X',
  HOURLY_PAY_PERCENT_QUARTILE_1_U: 'HOURLY_PAY_PERCENT_QUARTILE_1_U',
  HOURLY_PAY_PERCENT_QUARTILE_2_M: 'HOURLY_PAY_PERCENT_QUARTILE_2_M',
  HOURLY_PAY_PERCENT_QUARTILE_2_W: 'HOURLY_PAY_PERCENT_QUARTILE_2_W',
  HOURLY_PAY_PERCENT_QUARTILE_2_X: 'HOURLY_PAY_PERCENT_QUARTILE_2_X',
  HOURLY_PAY_PERCENT_QUARTILE_2_U: 'HOURLY_PAY_PERCENT_QUARTILE_2_U',
  HOURLY_PAY_PERCENT_QUARTILE_3_M: 'HOURLY_PAY_PERCENT_QUARTILE_3_M',
  HOURLY_PAY_PERCENT_QUARTILE_3_W: 'HOURLY_PAY_PERCENT_QUARTILE_3_W',
  HOURLY_PAY_PERCENT_QUARTILE_3_X: 'HOURLY_PAY_PERCENT_QUARTILE_3_X',
  HOURLY_PAY_PERCENT_QUARTILE_3_U: 'HOURLY_PAY_PERCENT_QUARTILE_3_U',
  HOURLY_PAY_PERCENT_QUARTILE_4_M: 'HOURLY_PAY_PERCENT_QUARTILE_4_M',
  HOURLY_PAY_PERCENT_QUARTILE_4_W: 'HOURLY_PAY_PERCENT_QUARTILE_4_W',
  HOURLY_PAY_PERCENT_QUARTILE_4_X: 'HOURLY_PAY_PERCENT_QUARTILE_4_X',
  HOURLY_PAY_PERCENT_QUARTILE_4_U: 'HOURLY_PAY_PERCENT_QUARTILE_4_U',
  PERCENT_RECEIVING_OT_PAY_M: 'PERCENT_RECEIVING_OT_PAY_M',
  PERCENT_RECEIVING_OT_PAY_W: 'PERCENT_RECEIVING_OT_PAY_W',
  PERCENT_RECEIVING_OT_PAY_X: 'PERCENT_RECEIVING_OT_PAY_X',
  PERCENT_RECEIVING_OT_PAY_U: 'PERCENT_RECEIVING_OT_PAY_U',
  PERCENT_RECEIVING_BONUS_PAY_M: 'PERCENT_RECEIVING_BONUS_PAY_M',
  PERCENT_RECEIVING_BONUS_PAY_W: 'PERCENT_RECEIVING_BONUS_PAY_W',
  PERCENT_RECEIVING_BONUS_PAY_X: 'PERCENT_RECEIVING_BONUS_PAY_X',
  PERCENT_RECEIVING_BONUS_PAY_U: 'PERCENT_RECEIVING_BONUS_PAY_U',
};

const QUARTILES = {
  Q1: 'Q1',
  Q2: 'Q2',
  Q3: 'Q3',
  Q4: 'Q4',
};

interface CalculatedAmount {
  calculationCode: string;
  value: string;
  isSuppressed: boolean;
}

interface ValueGenderCodePair {
  value: number;
  genderCode: string;
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
  static readonly REF_CATEGORY_PREFERENCE = [
    GENDER_CODES.MALE,
    GENDER_CODES.UNKNOWN,
    GENDER_CODES.NON_BINARY,
  ];

  dataByCategoryKey: any;
  sumByCategoryKey: any;
  countZerosByCategoryKey: any;
  isSorted: boolean;

  constructor() {
    this.dataByCategoryKey = {};
    this.sumByCategoryKey = {};
    this.countZerosByCategoryKey = {};
    this.isSorted = true;
  }

  push(value: number, genderCode: string) {
    const standardizedGenderCode =
      validateService.standardizeGenderCode(genderCode);

    if (!value) {
      // To save memory and computational effort in some of the calculations
      // we omit zero from the list of pushed values.
      // We do still need to keep a record of the number of zeros
      // to support certain calculations
      if (
        !this.countZerosByCategoryKey.hasOwnProperty(standardizedGenderCode)
      ) {
        this.countZerosByCategoryKey[standardizedGenderCode] = 0;
      }
      this.countZerosByCategoryKey[standardizedGenderCode] += 1;
      return;
    }

    //data for each gender category is kept in a separate list
    if (!this.dataByCategoryKey.hasOwnProperty(standardizedGenderCode)) {
      this.dataByCategoryKey[standardizedGenderCode] = [];
    }
    this.dataByCategoryKey[standardizedGenderCode].push(value);

    //keep a running sum of values for each gender category
    if (!this.sumByCategoryKey.hasOwnProperty(standardizedGenderCode)) {
      this.sumByCategoryKey[standardizedGenderCode] = 0;
    }
    this.sumByCategoryKey[standardizedGenderCode] += value;

    this.isSorted = false;
  }

  /* Sort the the array of values in each gender category. */
  sortEachGenderCategory() {
    if (this.isSorted) {
      return; //already sorted
    }
    Object.keys(this.dataByCategoryKey).forEach((k) => {
      // Avoid the default sort comparator (which sorts alphabetically)
      // by specifying an alternative compatator that sorts numerically
      this.dataByCategoryKey[k].sort((a: number, b: number) => a - b);
    });
  }

  getNonZeroValues(genderCode: string) {
    const standardizedGenderCode =
      validateService.standardizeGenderCode(genderCode);
    const values = this.dataByCategoryKey.hasOwnProperty(standardizedGenderCode)
      ? this.dataByCategoryKey[standardizedGenderCode]
      : [];
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
    const genderCategories = Object.values(
      GroupedColumnStats.REF_CATEGORY_PREFERENCE,
    );
    for (const genderCodeSynonyms of genderCategories) {
      // Arbitrarily pick any one value from the list
      // of synonyms for this gender category
      const genderCode = genderCodeSynonyms[0];

      const numPeopleInGenderCategory = this.getCountNonZeros(genderCode);
      if (
        numPeopleInGenderCategory >=
        reportCalcService.MIN_REQUIRED_COUNT_FOR_REF_CATEGORY
      ) {
        referenceGenderCode = genderCode;
        //break out of forEach loop
        break;
      }
    }
    return referenceGenderCode;
  }

  getCountNonZeros(genderCode: string) {
    const values = this.getNonZeroValues(genderCode);
    return values.length;
  }

  getCountZeros(genderCode: string) {
    const standardizedGenderCode =
      validateService.standardizeGenderCode(genderCode);
    return this.countZerosByCategoryKey.hasOwnProperty(standardizedGenderCode)
      ? this.countZerosByCategoryKey[standardizedGenderCode]
      : 0;
  }

  getCountAll(genderCode: string) {
    return this.getCountNonZeros(genderCode) + this.getCountZeros(genderCode);
  }

  getSum(genderCode: string) {
    const standardizedGenderCode =
      validateService.standardizeGenderCode(genderCode);
    return this.sumByCategoryKey.hasOwnProperty(standardizedGenderCode)
      ? this.sumByCategoryKey[standardizedGenderCode]
      : 0;
  }

  /* 
    Calculate and return the mean (average) from the array of values
    associated with the given genderCode.  Only consider values
    that are non-zero.
    */
  getMeanOfNonZeros(genderCode: string) {
    const count = this.getCountNonZeros(genderCode);
    const sum = this.getSum(genderCode);
    const avg = count != 0 ? sum / count : 0;
    return avg;
  }

  /* 
    Calculate and return the median from the array of values
    associated with the given genderCode. Only consider values
    that are non-zero.
   */
  getMedianOfNonZeros(genderCode: string) {
    // The logic in this function relies on the array of values for
    // a given genderCode being sorted.  Sort now to be sure.
    this.sortEachGenderCategory();

    const values = this.getNonZeroValues(genderCode);
    if (!values?.length) {
      return 0;
    }
    if (values.length % 2 == 1) {
      //odd number of values
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

/*
This class is designed to support efficient organization of data
into quartiles (according to some metric like Hourly Pay), and counts
of employees of each gender category within each quartile.  
Internally the class stores data as key-value pairs in a list, 
where key value pairs look like this:
  <data value, gender code>
*/
class TaggedColumnStats {
  private readonly data: ValueGenderCodePair[];
  private isSorted: boolean;

  constructor() {
    this.data = [];
    this.isSorted = true;
  }

  public push(value: number, genderCode: string) {
    const standardizedGenderCode =
      validateService.standardizeGenderCode(genderCode);
    this.data.push({ value: value, genderCode: standardizedGenderCode });
    this.isSorted = false;
  }

  /* sorts the internal data structure by value */
  private sort() {
    if (this.isSorted) {
      return; //already sorted
    }
    this.data.sort((a: ValueGenderCodePair, b: ValueGenderCodePair) =>
      a.value > b.value ? 1 : -1,
    );
    this.isSorted = true;
  }

  /*  
  Returns an object which includes counts of employees of each
  gender within each quartile.  The return object has this form:
  {
    Q1: {
      "M": 100
      "W": 102
      "X": 3
      "U": 10
    }, 
    Q2: {...},
    Q3: {...},
    Q4: {...}
  }
  If any given quartile has no employees of a given gender category then
  the gender code for that category isn't included in the quartile.
  */
  public getGenderCountsPerQuartile(): any {
    const result = {};
    const quartileBreaks = this.getQuartileBreaks();

    // Initialize the loop variable 'endIndex'
    // (the first quartile starts at 0, so if there was hypothetically
    // a quartile before that it would need to have an endIndex of -1)
    let endIndex = -1;

    quartileBreaks.forEach((breakIndex: number, i: number) => {
      const quartileName = Object.keys(QUARTILES)[i];
      const startIndex = endIndex + 1;
      endIndex = breakIndex;
      const countsByGenderCode = this.getGenderCountsInRange(
        startIndex,
        endIndex,
      );
      result[quartileName] = countsByGenderCode;
    });
    return result;
  }

  public getCount() {
    return this.data.length;
  }

  /*
  Returns a four element array containing the index of the last
  item from each quartile.  The resulting array will look like this:
  [
    index of the last item in the first quartile,
    index of the last item in the second quartile,
    index of the last item in the third quartile,
    index of the last item in the forth quartile,
  ]
  */
  getQuartileBreaks(): number[] {
    this.sort();
    const numRecords = this.getCount();
    if (numRecords == 0) {
      throw new Error('Cannot get quartile breaks on an empty dataset');
    }

    let quartile1EndIndex = 0;
    let quartile2EndIndex = 0;
    let quartile3EndIndex = 0;
    let quartile4EndIndex = 0;

    //Compute the breaks differently depending on how many records there are.
    //If the number of records is not evenly divisible by 4, then some quartiles
    //will need to be one larger than others.  If any quartiles need to be larger,
    //make larger according to the following priority: [Q1, Q4, Q2, Q3]
    if (numRecords % 2 == 0) {
      //either all quartiles are equal size, or
      //Q1 and Q4 are one larger than each of Q2 and Q3
      quartile1EndIndex = Math.ceil((1 / 4) * numRecords - 1);
      quartile2EndIndex = Math.round((1 / 2) * numRecords - 1);
      quartile3EndIndex = Math.floor((3 / 4) * numRecords - 1);
      quartile4EndIndex = numRecords - 1;
    } else if (numRecords % 4 == 1) {
      //ensure Q1 is one larger than all the others
      quartile1EndIndex = Math.ceil((1 / 4) * numRecords - 1);
      quartile2EndIndex = Math.round((1 / 2) * numRecords - 1);
      quartile3EndIndex = Math.round((3 / 4) * numRecords - 1);
      quartile4EndIndex = numRecords - 1;
    } else {
      //ensure Q1, Q4 and Q2 are all equal width, and Q3 is one smaller
      quartile1EndIndex = Math.ceil((1 / 4) * numRecords - 1);
      quartile2EndIndex = Math.ceil((1 / 2) * numRecords - 1);
      quartile3EndIndex = Math.floor((3 / 4) * numRecords - 1);
      quartile4EndIndex = numRecords - 1;
    }
    const breaks = [
      quartile1EndIndex,
      quartile2EndIndex,
      quartile3EndIndex,
      quartile4EndIndex,
    ];

    return breaks;
  }

  /*
  Scans all data items between the given start and end indexes, and
  counts the number of employees of each gender category within 
  those data.
  Returns an object with genderCodes as keys, and employee counts as values.  
  For example:
  {
    "M": 100
    "W": 102
    "X": 3
    "U": 10
  }
  */
  getGenderCountsInRange(startIndex: number, endIndex: number) {
    const countsByGenderCode = {};
    for (let i = startIndex; i <= endIndex; i++) {
      const item = this.data[i];
      if (!countsByGenderCode.hasOwnProperty(item.genderCode)) {
        countsByGenderCode[item.genderCode] = 0;
      }
      countsByGenderCode[item.genderCode] += 1;
    }
    return countsByGenderCode;
  }
}

const reportCalcService = {
  MIN_REQUIRED_PEOPLE_FOR_REPORT: 50,
  MIN_REQUIRED_COUNT_FOR_REF_CATEGORY: 10,
  MIN_REQUIRED_PEOPLE_COUNT_PER_GENDER: 10,
  MIN_REQUIRED_PEOPLE_WITH_DATA_COUNT: 10,

  /*
    Scans all given "rows" (from an ISubmission).  Each row is an array of values, and the
    first row is the header which gives the column names.  Validates each row, and if
    validation checks pass, performs all the required calculations for
    Pay Transparency reporting.  Returns a promise. If any validation 
    checks fail, the promise will be rejected with a RowErrors array.  If all 
    validation checks pass, the promise will be resolved with
    an array of CalculatedAmount objects.
  */
  async calculateAll(rows: any[]): Promise<CalculatedAmount[]> {
    const calculatedAmounts: CalculatedAmount[] = [];

    // Create data structures to support the mean and median
    // calculations for specific columns
    const hourlyPayStats = new GroupedColumnStats();
    const overtimePayStats = new GroupedColumnStats();
    const overtimeHoursStats = new GroupedColumnStats();
    const bonusPayStats = new GroupedColumnStats();

    // Create a data structure to support the hourly pay quartile
    // calculations
    const hourlyPayQuartileStats = new TaggedColumnStats();

    // Scan each row from the submission (except the header row) and
    // validate it.  If valid push the value of each column into the
    // "working objects" that that help us efficiently manage the calculations
    const rowErrors: RowError[] = [];
    const header = validateService.cleanRow(rows[0]);
    rows?.forEach((row: any, rowNum: number) => {
      if (rowNum == 0) {
        return; //skip the first row (the header)
      }
      const cleanedRow = validateService.cleanRow(row);
      const record = reportCalcServicePrivate.arrayToObject(cleanedRow, header);
      const recordNum = rowNum + 1; //numbering of records starts at 1
      const rowError: RowError = validateService.validateRecord(
        recordNum,
        record,
      );
      if (rowError) {
        rowErrors.push(rowError);
        return;
      }

      reportCalcServicePrivate.cleanCsvRecord(record);
      const hourlyPayDollars =
        reportCalcServicePrivate.getHourlyPayDollars(record);
      const overtimePayDollarsPerHour =
        record[SUBMISSION_ROW_COLUMNS.OVERTIME_PAY];
      const overtimeHours = record[SUBMISSION_ROW_COLUMNS.OVERTIME_HOURS];
      const bonusPayDollars = record[SUBMISSION_ROW_COLUMNS.BONUS_PAY];

      overtimePayStats.push(
        overtimePayDollarsPerHour,
        record[SUBMISSION_ROW_COLUMNS.GENDER_CODE],
      );
      overtimeHoursStats.push(
        overtimeHours,
        record[SUBMISSION_ROW_COLUMNS.GENDER_CODE],
      );
      bonusPayStats.push(
        bonusPayDollars,
        record[SUBMISSION_ROW_COLUMNS.GENDER_CODE],
      );

      // Load the same hourlyPay value into two different data structures:
      // one to support efficient mean/median calculations, and the other
      //to support the quartile calculations
      if (hourlyPayDollars) {
        hourlyPayStats.push(
          hourlyPayDollars,
          record[SUBMISSION_ROW_COLUMNS.GENDER_CODE],
        );
        hourlyPayQuartileStats.push(
          hourlyPayDollars,
          record[SUBMISSION_ROW_COLUMNS.GENDER_CODE],
        );
      }
    });

    // If any RowErrors were found, wrap them into a ValidationError and throw it
    if (rowErrors.length) {
      throw new ValidationError(null, rowErrors, null);
    }

    // Only allow the calculations to be performed if at least two gender categories
    // have at least <MIN_REQUIRED_PEOPLE_COUNT_PER_GENDER> employees.
    // If this is not the case, return null as a signal that calculations are
    // not permitted.
    const suppressAllCalculations =
      Object.values(GENDER_CODES)
        .map((genderCodes) => genderCodes[0])
        .filter((genderCode) =>
          reportCalcServicePrivate.meetsPeopleCountThreshold(
            overtimeHoursStats.getCountAll(genderCode),
          ),
        ).length <= 1;

    // The same reference gender category is used for all calculations
    const refGenderCode = !suppressAllCalculations
      ? hourlyPayStats.getReferenceGenderCode()
      : null;

    // Perform calculations on the raw CSV data, and collect them
    // into an array of CalculatedAmount objects
    // (Each CalculatedAmount has a code indicating which calculation it
    // represents, and a value for that calculation)
    calculatedAmounts.push(
      ...reportCalcServicePrivate.calculateMeanHourlyPayGaps(
        !suppressAllCalculations ? hourlyPayStats : null,
        refGenderCode,
      ),
    );
    calculatedAmounts.push(
      ...reportCalcServicePrivate.calculateMedianHourlyPayGaps(
        !suppressAllCalculations ? hourlyPayStats : null,
        refGenderCode,
      ),
    );
    calculatedAmounts.push(
      ...reportCalcServicePrivate.calculateMeanOvertimePayGaps(
        !suppressAllCalculations ? overtimePayStats : null,
        refGenderCode,
      ),
    );
    calculatedAmounts.push(
      ...reportCalcServicePrivate.calculateMedianOvertimePayGaps(
        !suppressAllCalculations ? overtimePayStats : null,
        refGenderCode,
      ),
    );
    calculatedAmounts.push(
      ...reportCalcServicePrivate.calculateMeanOvertimeHoursGaps(
        !suppressAllCalculations ? overtimeHoursStats : null,
        refGenderCode,
      ),
    );
    calculatedAmounts.push(
      ...reportCalcServicePrivate.calculateMedianOvertimeHoursGaps(
        !suppressAllCalculations ? overtimeHoursStats : null,
        refGenderCode,
      ),
    );
    calculatedAmounts.push(
      ...reportCalcServicePrivate.calculateMeanBonusPayGaps(
        !suppressAllCalculations ? bonusPayStats : null,
        refGenderCode,
      ),
    );
    calculatedAmounts.push(
      ...reportCalcServicePrivate.calculateMedianBonusPayGaps(
        !suppressAllCalculations ? bonusPayStats : null,
        refGenderCode,
      ),
    );
    calculatedAmounts.push(
      ...reportCalcServicePrivate.calculateHourlyPayQuartiles(
        !suppressAllCalculations ? hourlyPayQuartileStats : null,
      ),
    );
    calculatedAmounts.push(
      ...reportCalcServicePrivate.calculatePercentReceivingOvertimePay(
        !suppressAllCalculations ? overtimePayStats : null,
        refGenderCode,
      ),
    );
    calculatedAmounts.push(
      ...reportCalcServicePrivate.calculatePercentReceivingBonusPay(
        !suppressAllCalculations ? bonusPayStats : null,
        refGenderCode,
      ),
    );

    // Although not technically a calculation, also include the reference
    // gender category code in the list of CalculatedAmounts.
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.REFERENCE_GENDER_CATEGORY_CODE,
      value: refGenderCode,
      isSuppressed: refGenderCode === null,
    });

    logger.debug(`Calculating all amounts for report finished.`);
    return calculatedAmounts;
  },
};

const reportCalcServicePrivate = {
  /*
  Gets the hourly pay quartile calculationCode for the given quartile and
  genderCode.  Quartile should be one of ("Q1", "Q2", "Q3", "Q4").
  */
  getHourlyPayQuartileCalculationCode(
    quartile: string,
    standardizedGenderCode: string,
  ) {
    //
    if (quartile.startsWith('Q')) {
      quartile = quartile.substring(1);
    }
    const primaryGenderCode = validateService.unstandardizeGenderCode(
      standardizedGenderCode,
    );
    const calculationCodeKey = `HOURLY_PAY_PERCENT_QUARTILE_${quartile}_${primaryGenderCode}`;
    if (!CALCULATION_CODES.hasOwnProperty(calculationCodeKey)) {
      throw new Error(`Unknown calculation code: ${calculationCodeKey}`);
    }
    return CALCULATION_CODES[calculationCodeKey];
  },

  meetsPeopleCountThreshold(peopleCount: number) {
    return (
      peopleCount >= reportCalcService.MIN_REQUIRED_PEOPLE_COUNT_PER_GENDER
    );
  },

  /* Counts the number of array elements that are not null */
  countNonNulls(arr: any[]): number {
    return arr ? arr.filter((d) => d !== null).length : 0;
  },

  /**
   * Copies elements from the given array into properties of a new object.
   * @arr: any array of input values
   * @namesForProperties an array which specifies the property names that
   * each value from 'arr' will be copied into.
   */
  arrayToObject(arr: any[], namesForProperties: string[]) {
    const obj = {};
    namesForProperties?.forEach((propName, i) => {
      obj[propName] = arr && i < arr.length ? arr[i] : null;
    });
    return obj;
  },

  calculateMeanHourlyPayGaps(
    hourlyPayStats: GroupedColumnStats | null,
    refGenderCode: string,
  ): CalculatedAmount[] {
    if (hourlyPayStats && !refGenderCode) {
      throw new Error('Reference Gender Code is required');
    }

    let meanHourlyPayDiffM = null;
    let meanHourlyPayDiffF = null;
    let meanHourlyPayDiffX = null;
    let meanHourlyPayDiffU = null;

    if (
      hourlyPayStats &&
      this.meetsPeopleCountThreshold(
        hourlyPayStats.getCountNonZeros(refGenderCode),
      )
    ) {
      const meanHourlyPayRef = hourlyPayStats.getMeanOfNonZeros(refGenderCode);
      if (
        this.meetsPeopleCountThreshold(
          hourlyPayStats.getCountNonZeros(GENDER_CODES.MALE[0]),
        )
      ) {
        meanHourlyPayDiffM =
          ((meanHourlyPayRef -
            hourlyPayStats.getMeanOfNonZeros(GENDER_CODES.MALE[0])) /
            meanHourlyPayRef) *
          100;
      }
      if (
        this.meetsPeopleCountThreshold(
          hourlyPayStats.getCountNonZeros(GENDER_CODES.FEMALE[0]),
        )
      ) {
        meanHourlyPayDiffF =
          ((meanHourlyPayRef -
            hourlyPayStats.getMeanOfNonZeros(GENDER_CODES.FEMALE[0])) /
            meanHourlyPayRef) *
          100;
      }
      if (
        this.meetsPeopleCountThreshold(
          hourlyPayStats.getCountNonZeros(GENDER_CODES.NON_BINARY[0]),
        )
      ) {
        meanHourlyPayDiffX =
          ((meanHourlyPayRef -
            hourlyPayStats.getMeanOfNonZeros(GENDER_CODES.NON_BINARY[0])) /
            meanHourlyPayRef) *
          100;
      }
      if (
        this.meetsPeopleCountThreshold(
          hourlyPayStats.getCountNonZeros(GENDER_CODES.UNKNOWN[0]),
        )
      ) {
        meanHourlyPayDiffU =
          ((meanHourlyPayRef -
            hourlyPayStats.getMeanOfNonZeros(GENDER_CODES.UNKNOWN[0])) /
            meanHourlyPayRef) *
          100;
      }
    }

    // If only one gender category has a non-null calculated amount,
    // reset it to null.
    if (
      reportCalcServicePrivate.countNonNulls([
        meanHourlyPayDiffM,
        meanHourlyPayDiffF,
        meanHourlyPayDiffX,
        meanHourlyPayDiffU,
      ]) < 2
    ) {
      meanHourlyPayDiffM = null;
      meanHourlyPayDiffF = null;
      meanHourlyPayDiffX = null;
      meanHourlyPayDiffU = null;
    }

    const calculatedAmounts = [];
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_M,
      value: meanHourlyPayDiffM,
      isSuppressed: meanHourlyPayDiffM === null,
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_W,
      value: meanHourlyPayDiffF,
      isSuppressed: meanHourlyPayDiffF === null,
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_X,
      value: meanHourlyPayDiffX,
      isSuppressed: meanHourlyPayDiffX === null,
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_U,
      value: meanHourlyPayDiffU,
      isSuppressed: meanHourlyPayDiffU === null,
    });

    return calculatedAmounts;
  },

  calculateMedianHourlyPayGaps(
    hourlyPayStats: GroupedColumnStats | null,
    refGenderCode: string,
  ): CalculatedAmount[] {
    if (hourlyPayStats && !refGenderCode) {
      throw new Error('Reference Gender Code is required');
    }

    let medianHourlyPayDiffM = null;
    let medianHourlyPayDiffF = null;
    let medianHourlyPayDiffX = null;
    let medianHourlyPayDiffU = null;

    if (
      hourlyPayStats &&
      this.meetsPeopleCountThreshold(
        hourlyPayStats.getCountNonZeros(refGenderCode),
      )
    ) {
      const medianHourlyPayRef =
        hourlyPayStats.getMedianOfNonZeros(refGenderCode);
      if (
        this.meetsPeopleCountThreshold(
          hourlyPayStats.getCountNonZeros(GENDER_CODES.MALE[0]),
        )
      ) {
        medianHourlyPayDiffM =
          ((medianHourlyPayRef -
            hourlyPayStats.getMedianOfNonZeros(GENDER_CODES.MALE[0])) /
            medianHourlyPayRef) *
          100;
      }
      if (
        this.meetsPeopleCountThreshold(
          hourlyPayStats.getCountNonZeros(GENDER_CODES.FEMALE[0]),
        )
      ) {
        medianHourlyPayDiffF =
          ((medianHourlyPayRef -
            hourlyPayStats.getMedianOfNonZeros(GENDER_CODES.FEMALE[0])) /
            medianHourlyPayRef) *
          100;
      }
      if (
        this.meetsPeopleCountThreshold(
          hourlyPayStats.getCountNonZeros(GENDER_CODES.NON_BINARY[0]),
        )
      ) {
        medianHourlyPayDiffX =
          ((medianHourlyPayRef -
            hourlyPayStats.getMedianOfNonZeros(GENDER_CODES.NON_BINARY[0])) /
            medianHourlyPayRef) *
          100;
      }
      if (
        this.meetsPeopleCountThreshold(
          hourlyPayStats.getCountNonZeros(GENDER_CODES.UNKNOWN[0]),
        )
      ) {
        medianHourlyPayDiffU =
          ((medianHourlyPayRef -
            hourlyPayStats.getMedianOfNonZeros(GENDER_CODES.UNKNOWN[0])) /
            medianHourlyPayRef) *
          100;
      }
    }

    // If only one gender category has a non-null calculated amount,
    // reset it to null.
    if (
      reportCalcServicePrivate.countNonNulls([
        medianHourlyPayDiffM,
        medianHourlyPayDiffF,
        medianHourlyPayDiffX,
        medianHourlyPayDiffU,
      ]) < 2
    ) {
      medianHourlyPayDiffM = null;
      medianHourlyPayDiffF = null;
      medianHourlyPayDiffX = null;
      medianHourlyPayDiffU = null;
    }

    const calculatedAmounts = [];
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_M,
      value: medianHourlyPayDiffM,
      isSuppressed: medianHourlyPayDiffM === null,
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_W,
      value: medianHourlyPayDiffF,
      isSuppressed: medianHourlyPayDiffF === null,
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_X,
      value: medianHourlyPayDiffX,
      isSuppressed: medianHourlyPayDiffX === null,
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_U,
      value: medianHourlyPayDiffU,
      isSuppressed: medianHourlyPayDiffU === null,
    });

    return calculatedAmounts;
  },

  calculateMeanOvertimePayGaps(
    overtimePayStats: GroupedColumnStats | null,
    refGenderCode: string,
  ): CalculatedAmount[] {
    if (overtimePayStats && !refGenderCode) {
      throw new Error('Reference Gender Code is required');
    }

    let meanOvertimePayDiffM = null;
    let meanOvertimePayDiffF = null;
    let meanOvertimePayDiffX = null;
    let meanOvertimePayDiffU = null;

    if (
      overtimePayStats &&
      this.meetsPeopleCountThreshold(
        overtimePayStats.getCountNonZeros(refGenderCode),
      )
    ) {
      const meanOvertimePayRef =
        overtimePayStats.getMeanOfNonZeros(refGenderCode);
      if (
        this.meetsPeopleCountThreshold(
          overtimePayStats.getCountNonZeros(GENDER_CODES.MALE[0]),
        )
      ) {
        meanOvertimePayDiffM =
          ((meanOvertimePayRef -
            overtimePayStats.getMeanOfNonZeros(GENDER_CODES.MALE[0])) /
            meanOvertimePayRef) *
          100;
      }
      if (
        this.meetsPeopleCountThreshold(
          overtimePayStats.getCountNonZeros(GENDER_CODES.FEMALE[0]),
        )
      ) {
        meanOvertimePayDiffF =
          ((meanOvertimePayRef -
            overtimePayStats.getMeanOfNonZeros(GENDER_CODES.FEMALE[0])) /
            meanOvertimePayRef) *
          100;
      }
      if (
        this.meetsPeopleCountThreshold(
          overtimePayStats.getCountNonZeros(GENDER_CODES.NON_BINARY[0]),
        )
      ) {
        meanOvertimePayDiffX =
          ((meanOvertimePayRef -
            overtimePayStats.getMeanOfNonZeros(GENDER_CODES.NON_BINARY[0])) /
            meanOvertimePayRef) *
          100;
      }
      if (
        this.meetsPeopleCountThreshold(
          overtimePayStats.getCountNonZeros(GENDER_CODES.UNKNOWN[0]),
        )
      ) {
        meanOvertimePayDiffU =
          ((meanOvertimePayRef -
            overtimePayStats.getMeanOfNonZeros(GENDER_CODES.UNKNOWN[0])) /
            meanOvertimePayRef) *
          100;
      }
    }

    // If only one gender category has a non-null calculated amount,
    // reset it to null.
    if (
      reportCalcServicePrivate.countNonNulls([
        meanOvertimePayDiffM,
        meanOvertimePayDiffF,
        meanOvertimePayDiffX,
        meanOvertimePayDiffU,
      ]) < 2
    ) {
      meanOvertimePayDiffM = null;
      meanOvertimePayDiffF = null;
      meanOvertimePayDiffX = null;
      meanOvertimePayDiffU = null;
    }

    const calculatedAmounts = [];
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEAN_OT_PAY_DIFF_M,
      value: meanOvertimePayDiffM,
      isSuppressed: meanOvertimePayDiffM === null,
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEAN_OT_PAY_DIFF_W,
      value: meanOvertimePayDiffF,
      isSuppressed: meanOvertimePayDiffF === null,
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEAN_OT_PAY_DIFF_X,
      value: meanOvertimePayDiffX,
      isSuppressed: meanOvertimePayDiffX === null,
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEAN_OT_PAY_DIFF_U,
      value: meanOvertimePayDiffU,
      isSuppressed: meanOvertimePayDiffU === null,
    });

    return calculatedAmounts;
  },

  calculateMedianOvertimePayGaps(
    overtimePayStats: GroupedColumnStats | null,
    refGenderCode: string,
  ): CalculatedAmount[] {
    if (overtimePayStats && !refGenderCode) {
      throw new Error('Reference Gender Code is required');
    }

    let medianOvertimePayDiffM = null;
    let medianOvertimePayDiffF = null;
    let medianOvertimePayDiffX = null;
    let medianOvertimePayDiffU = null;

    if (
      overtimePayStats &&
      this.meetsPeopleCountThreshold(
        overtimePayStats.getCountNonZeros(refGenderCode),
      )
    ) {
      const medianOvertimePayRef =
        overtimePayStats.getMedianOfNonZeros(refGenderCode);
      if (
        this.meetsPeopleCountThreshold(
          overtimePayStats.getCountNonZeros(GENDER_CODES.MALE[0]),
        )
      ) {
        medianOvertimePayDiffM =
          ((medianOvertimePayRef -
            overtimePayStats.getMedianOfNonZeros(GENDER_CODES.MALE[0])) /
            medianOvertimePayRef) *
          100;
      }
      if (
        this.meetsPeopleCountThreshold(
          overtimePayStats.getCountNonZeros(GENDER_CODES.FEMALE[0]),
        )
      ) {
        medianOvertimePayDiffF =
          ((medianOvertimePayRef -
            overtimePayStats.getMedianOfNonZeros(GENDER_CODES.FEMALE[0])) /
            medianOvertimePayRef) *
          100;
      }
      if (
        this.meetsPeopleCountThreshold(
          overtimePayStats.getCountNonZeros(GENDER_CODES.NON_BINARY[0]),
        )
      ) {
        medianOvertimePayDiffX =
          ((medianOvertimePayRef -
            overtimePayStats.getMedianOfNonZeros(GENDER_CODES.NON_BINARY[0])) /
            medianOvertimePayRef) *
          100;
      }
      if (
        this.meetsPeopleCountThreshold(
          overtimePayStats.getCountNonZeros(GENDER_CODES.UNKNOWN[0]),
        )
      ) {
        medianOvertimePayDiffU =
          ((medianOvertimePayRef -
            overtimePayStats.getMedianOfNonZeros(GENDER_CODES.UNKNOWN[0])) /
            medianOvertimePayRef) *
          100;
      }
    }

    // If only one gender category has a non-null calculated amount,
    // reset it to null.
    if (
      reportCalcServicePrivate.countNonNulls([
        medianOvertimePayDiffM,
        medianOvertimePayDiffF,
        medianOvertimePayDiffX,
        medianOvertimePayDiffU,
      ]) < 2
    ) {
      medianOvertimePayDiffM = null;
      medianOvertimePayDiffF = null;
      medianOvertimePayDiffX = null;
      medianOvertimePayDiffU = null;
    }

    const calculatedAmounts = [];
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEDIAN_OT_PAY_DIFF_M,
      value: medianOvertimePayDiffM,
      isSuppressed: medianOvertimePayDiffM === null,
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEDIAN_OT_PAY_DIFF_W,
      value: medianOvertimePayDiffF,
      isSuppressed: medianOvertimePayDiffF === null,
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEDIAN_OT_PAY_DIFF_X,
      value: medianOvertimePayDiffX,
      isSuppressed: medianOvertimePayDiffX === null,
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEDIAN_OT_PAY_DIFF_U,
      value: medianOvertimePayDiffU,
      isSuppressed: medianOvertimePayDiffU === null,
    });

    return calculatedAmounts;
  },

  /*
  Calculated gaps are given as a difference in mean overtime hours between 
  each gender group and the reference group
  */
  calculateMeanOvertimeHoursGaps(
    overtimeHoursStats: GroupedColumnStats | null,
    refGenderCode: string,
  ): CalculatedAmount[] {
    if (overtimeHoursStats && !refGenderCode) {
      throw new Error('Reference Gender Code is required');
    }

    let meanOvertimeHoursDiffM = null;
    let meanOvertimeHoursDiffF = null;
    let meanOvertimeHoursDiffX = null;
    let meanOvertimeHoursDiffU = null;

    if (
      overtimeHoursStats &&
      this.meetsPeopleCountThreshold(
        overtimeHoursStats.getCountNonZeros(refGenderCode),
      )
    ) {
      const meanOvertimeHoursRef =
        overtimeHoursStats.getMeanOfNonZeros(refGenderCode);
      if (
        this.meetsPeopleCountThreshold(
          overtimeHoursStats.getCountNonZeros(GENDER_CODES.MALE[0]),
        )
      ) {
        meanOvertimeHoursDiffM =
          overtimeHoursStats.getMeanOfNonZeros(GENDER_CODES.MALE[0]) -
          meanOvertimeHoursRef;
      }
      if (
        this.meetsPeopleCountThreshold(
          overtimeHoursStats.getCountNonZeros(GENDER_CODES.FEMALE[0]),
        )
      ) {
        meanOvertimeHoursDiffF =
          overtimeHoursStats.getMeanOfNonZeros(GENDER_CODES.FEMALE[0]) -
          meanOvertimeHoursRef;
      }
      if (
        this.meetsPeopleCountThreshold(
          overtimeHoursStats.getCountNonZeros(GENDER_CODES.NON_BINARY[0]),
        )
      ) {
        meanOvertimeHoursDiffX =
          overtimeHoursStats.getMeanOfNonZeros(GENDER_CODES.NON_BINARY[0]) -
          meanOvertimeHoursRef;
      }
      if (
        this.meetsPeopleCountThreshold(
          overtimeHoursStats.getCountNonZeros(GENDER_CODES.UNKNOWN[0]),
        )
      ) {
        meanOvertimeHoursDiffU =
          overtimeHoursStats.getMeanOfNonZeros(GENDER_CODES.UNKNOWN[0]) -
          meanOvertimeHoursRef;
      }
    }

    // If only one gender category has a non-null calculated amount,
    // reset it to null.
    if (
      reportCalcServicePrivate.countNonNulls([
        meanOvertimeHoursDiffM,
        meanOvertimeHoursDiffF,
        meanOvertimeHoursDiffX,
        meanOvertimeHoursDiffU,
      ]) < 2
    ) {
      meanOvertimeHoursDiffM = null;
      meanOvertimeHoursDiffF = null;
      meanOvertimeHoursDiffX = null;
      meanOvertimeHoursDiffU = null;
    }

    const calculatedAmounts = [];
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEAN_OT_HOURS_DIFF_M,
      value: meanOvertimeHoursDiffM,
      isSuppressed: meanOvertimeHoursDiffM === null,
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEAN_OT_HOURS_DIFF_W,
      value: meanOvertimeHoursDiffF,
      isSuppressed: meanOvertimeHoursDiffF === null,
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEAN_OT_HOURS_DIFF_X,
      value: meanOvertimeHoursDiffX,
      isSuppressed: meanOvertimeHoursDiffX === null,
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEAN_OT_HOURS_DIFF_U,
      value: meanOvertimeHoursDiffU,
      isSuppressed: meanOvertimeHoursDiffU === null,
    });

    return calculatedAmounts;
  },

  /*
  Calculated gaps are given as a difference in median overtime hours between 
  each gender group and the reference group
  */
  calculateMedianOvertimeHoursGaps(
    overtimeHoursStats: GroupedColumnStats | null,
    refGenderCode: string,
  ): CalculatedAmount[] {
    if (overtimeHoursStats && !refGenderCode) {
      throw new Error('Reference Gender Code is required');
    }

    let medianOvertimeHoursDiffM = null;
    let medianOvertimeHoursDiffF = null;
    let medianOvertimeHoursDiffX = null;
    let medianOvertimeHoursDiffU = null;

    if (
      overtimeHoursStats &&
      this.meetsPeopleCountThreshold(
        overtimeHoursStats.getCountNonZeros(refGenderCode),
      )
    ) {
      const medianOvertimeHoursRef =
        overtimeHoursStats.getMedianOfNonZeros(refGenderCode);
      if (
        this.meetsPeopleCountThreshold(
          overtimeHoursStats.getCountNonZeros(GENDER_CODES.MALE[0]),
        )
      ) {
        medianOvertimeHoursDiffM =
          overtimeHoursStats.getMedianOfNonZeros(GENDER_CODES.MALE[0]) -
          medianOvertimeHoursRef;
      }
      if (
        this.meetsPeopleCountThreshold(
          overtimeHoursStats.getCountNonZeros(GENDER_CODES.FEMALE[0]),
        )
      ) {
        medianOvertimeHoursDiffF =
          overtimeHoursStats.getMedianOfNonZeros(GENDER_CODES.FEMALE[0]) -
          medianOvertimeHoursRef;
      }
      if (
        this.meetsPeopleCountThreshold(
          overtimeHoursStats.getCountNonZeros(GENDER_CODES.NON_BINARY[0]),
        )
      ) {
        medianOvertimeHoursDiffX =
          overtimeHoursStats.getMedianOfNonZeros(GENDER_CODES.NON_BINARY[0]) -
          medianOvertimeHoursRef;
      }
      if (
        this.meetsPeopleCountThreshold(
          overtimeHoursStats.getCountNonZeros(GENDER_CODES.UNKNOWN[0]),
        )
      ) {
        medianOvertimeHoursDiffU =
          overtimeHoursStats.getMedianOfNonZeros(GENDER_CODES.UNKNOWN[0]) -
          medianOvertimeHoursRef;
      }
    }

    // If only one gender category has a non-null calculated amount,
    // reset it to null.
    if (
      reportCalcServicePrivate.countNonNulls([
        medianOvertimeHoursDiffM,
        medianOvertimeHoursDiffF,
        medianOvertimeHoursDiffX,
        medianOvertimeHoursDiffU,
      ]) < 2
    ) {
      medianOvertimeHoursDiffM = null;
      medianOvertimeHoursDiffF = null;
      medianOvertimeHoursDiffX = null;
      medianOvertimeHoursDiffU = null;
    }

    const calculatedAmounts = [];
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEDIAN_OT_HOURS_DIFF_M,
      value: medianOvertimeHoursDiffM,
      isSuppressed: medianOvertimeHoursDiffM === null,
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEDIAN_OT_HOURS_DIFF_W,
      value: medianOvertimeHoursDiffF,
      isSuppressed: medianOvertimeHoursDiffF === null,
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEDIAN_OT_HOURS_DIFF_X,
      value: medianOvertimeHoursDiffX,
      isSuppressed: medianOvertimeHoursDiffX === null,
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEDIAN_OT_HOURS_DIFF_U,
      value: medianOvertimeHoursDiffU,
      isSuppressed: medianOvertimeHoursDiffU === null,
    });

    return calculatedAmounts;
  },

  calculateMeanBonusPayGaps(
    bonusPayStats: GroupedColumnStats | null,
    refGenderCode: string,
  ): CalculatedAmount[] {
    if (bonusPayStats && !refGenderCode) {
      throw new Error('Reference Gender Code is required');
    }

    let meanBonusPayDiffM = null;
    let meanBonusPayDiffF = null;
    let meanBonusPayDiffX = null;
    let meanBonusPayDiffU = null;

    if (
      bonusPayStats &&
      this.meetsPeopleCountThreshold(
        bonusPayStats.getCountNonZeros(refGenderCode),
      )
    ) {
      const meanBonusPayRef = bonusPayStats.getMeanOfNonZeros(refGenderCode);
      if (
        this.meetsPeopleCountThreshold(
          bonusPayStats.getCountNonZeros(GENDER_CODES.MALE[0]),
        )
      ) {
        meanBonusPayDiffM =
          ((meanBonusPayRef -
            bonusPayStats.getMeanOfNonZeros(GENDER_CODES.MALE[0])) /
            meanBonusPayRef) *
          100;
      }
      if (
        this.meetsPeopleCountThreshold(
          bonusPayStats.getCountNonZeros(GENDER_CODES.FEMALE[0]),
        )
      ) {
        meanBonusPayDiffF =
          ((meanBonusPayRef -
            bonusPayStats.getMeanOfNonZeros(GENDER_CODES.FEMALE[0])) /
            meanBonusPayRef) *
          100;
      }
      if (
        this.meetsPeopleCountThreshold(
          bonusPayStats.getCountNonZeros(GENDER_CODES.NON_BINARY[0]),
        )
      ) {
        meanBonusPayDiffX =
          ((meanBonusPayRef -
            bonusPayStats.getMeanOfNonZeros(GENDER_CODES.NON_BINARY[0])) /
            meanBonusPayRef) *
          100;
      }
      if (
        this.meetsPeopleCountThreshold(
          bonusPayStats.getCountNonZeros(GENDER_CODES.UNKNOWN[0]),
        )
      ) {
        meanBonusPayDiffU =
          ((meanBonusPayRef -
            bonusPayStats.getMeanOfNonZeros(GENDER_CODES.UNKNOWN[0])) /
            meanBonusPayRef) *
          100;
      }
    }

    // If only one gender category has a non-null calculated amount,
    // reset it to null.
    if (
      reportCalcServicePrivate.countNonNulls([
        meanBonusPayDiffM,
        meanBonusPayDiffF,
        meanBonusPayDiffX,
        meanBonusPayDiffU,
      ]) < 2
    ) {
      meanBonusPayDiffM = null;
      meanBonusPayDiffF = null;
      meanBonusPayDiffX = null;
      meanBonusPayDiffU = null;
    }

    const calculatedAmounts = [];
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEAN_BONUS_PAY_DIFF_M,
      value: meanBonusPayDiffM,
      isSuppressed: meanBonusPayDiffM === null,
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEAN_BONUS_PAY_DIFF_W,
      value: meanBonusPayDiffF,
      isSuppressed: meanBonusPayDiffF === null,
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEAN_BONUS_PAY_DIFF_X,
      value: meanBonusPayDiffX,
      isSuppressed: meanBonusPayDiffX === null,
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEAN_BONUS_PAY_DIFF_U,
      value: meanBonusPayDiffU,
      isSuppressed: meanBonusPayDiffU === null,
    });

    return calculatedAmounts;
  },

  calculateMedianBonusPayGaps(
    bonusPayStats: GroupedColumnStats | null,
    refGenderCode: string,
  ): CalculatedAmount[] {
    if (bonusPayStats && !refGenderCode) {
      throw new Error('Reference Gender Code is required');
    }

    let medianBonusPayDiffM = null;
    let medianBonusPayDiffF = null;
    let medianBonusPayDiffX = null;
    let medianBonusPayDiffU = null;

    if (
      bonusPayStats &&
      this.meetsPeopleCountThreshold(
        bonusPayStats.getCountNonZeros(refGenderCode),
      )
    ) {
      const medianBonusPayRef =
        bonusPayStats.getMedianOfNonZeros(refGenderCode);
      if (
        this.meetsPeopleCountThreshold(
          bonusPayStats.getCountNonZeros(GENDER_CODES.MALE[0]),
        )
      ) {
        medianBonusPayDiffM =
          ((medianBonusPayRef -
            bonusPayStats.getMedianOfNonZeros(GENDER_CODES.MALE[0])) /
            medianBonusPayRef) *
          100;
      }
      if (
        this.meetsPeopleCountThreshold(
          bonusPayStats.getCountNonZeros(GENDER_CODES.FEMALE[0]),
        )
      ) {
        medianBonusPayDiffF =
          ((medianBonusPayRef -
            bonusPayStats.getMedianOfNonZeros(GENDER_CODES.FEMALE[0])) /
            medianBonusPayRef) *
          100;
      }
      if (
        this.meetsPeopleCountThreshold(
          bonusPayStats.getCountNonZeros(GENDER_CODES.NON_BINARY[0]),
        )
      ) {
        medianBonusPayDiffX =
          ((medianBonusPayRef -
            bonusPayStats.getMedianOfNonZeros(GENDER_CODES.NON_BINARY[0])) /
            medianBonusPayRef) *
          100;
      }
      if (
        this.meetsPeopleCountThreshold(
          bonusPayStats.getCountNonZeros(GENDER_CODES.UNKNOWN[0]),
        )
      ) {
        medianBonusPayDiffU =
          ((medianBonusPayRef -
            bonusPayStats.getMedianOfNonZeros(GENDER_CODES.UNKNOWN[0])) /
            medianBonusPayRef) *
          100;
      }
    }

    // If only one gender category has a non-null calculated amount,
    // reset it to null.
    if (
      reportCalcServicePrivate.countNonNulls([
        medianBonusPayDiffM,
        medianBonusPayDiffF,
        medianBonusPayDiffX,
        medianBonusPayDiffU,
      ]) < 2
    ) {
      medianBonusPayDiffM = null;
      medianBonusPayDiffF = null;
      medianBonusPayDiffX = null;
      medianBonusPayDiffU = null;
    }

    const calculatedAmounts = [];
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEDIAN_BONUS_PAY_DIFF_M,
      value: medianBonusPayDiffM,
      isSuppressed: medianBonusPayDiffM === null,
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEDIAN_BONUS_PAY_DIFF_W,
      value: medianBonusPayDiffF,
      isSuppressed: medianBonusPayDiffF === null,
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEDIAN_BONUS_PAY_DIFF_X,
      value: medianBonusPayDiffX,
      isSuppressed: medianBonusPayDiffX === null,
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.MEDIAN_BONUS_PAY_DIFF_U,
      value: medianBonusPayDiffU,
      isSuppressed: medianBonusPayDiffU === null,
    });

    return calculatedAmounts;
  },

  /*
  Returns an array with length 4 * <# of gender categories>.  Each
  CalculatedAmount returned represents a percentage of employees
  in a particular hourly pay quartile and gender group.  
  */
  calculateHourlyPayQuartiles(
    hourlyPayQuartileStats: TaggedColumnStats | null,
  ): CalculatedAmount[] {
    const calculatedAmounts = [];

    const genderCountsPerQuartile = hourlyPayQuartileStats
      ? hourlyPayQuartileStats.getGenderCountsPerQuartile()
      : null;
    const allGenderCodes = Object.keys(STANDARDIZED_GENDER_CODES).map(
      (g) => STANDARDIZED_GENDER_CODES[g],
    );

    Object.keys(QUARTILES).forEach((quartile) => {
      const genderCounts = genderCountsPerQuartile
        ? genderCountsPerQuartile[quartile]
        : {};

      const nonSuppressedGenderCounts = {};

      // First iteration of employee counts for each gender to determine
      // which gender groups meet the threshold for display in the report
      // (i.e. which are not suppressed)
      allGenderCodes.forEach((standardizedGenderCode) => {
        const genderCount = genderCounts.hasOwnProperty(standardizedGenderCode)
          ? genderCounts[standardizedGenderCode]
          : 0;
        const isSuppressed = !this.meetsPeopleCountThreshold(genderCount);
        if (!isSuppressed) {
          nonSuppressedGenderCounts[standardizedGenderCode] = genderCount;
        }
      });

      // Compute the total number of employees in gender categories that
      // are not suppressed.
      const nonSuppressedTotalCount: number = Object.values<number>(
        nonSuppressedGenderCounts,
      ).reduce(
        (accumulator: number, currentValue: number) =>
          accumulator + currentValue,
        0,
      );

      // Second iteration of employee counts to calculate a percentage
      // of the gender group in the given quartile.
      allGenderCodes.forEach((standardizedGenderCode) => {
        const isSuppressed = !nonSuppressedGenderCounts.hasOwnProperty(
          standardizedGenderCode,
        );
        let percent = null;
        const calculationCode =
          reportCalcServicePrivate.getHourlyPayQuartileCalculationCode(
            quartile,
            standardizedGenderCode,
          );

        if (!isSuppressed) {
          const genderCount = nonSuppressedGenderCounts[standardizedGenderCode];
          percent = (genderCount / nonSuppressedTotalCount) * 100;
        }

        calculatedAmounts.push({
          calculationCode: calculationCode,
          value: percent,
          isSuppressed: isSuppressed,
        });
      });
    });
    console.log(calculatedAmounts);
    return calculatedAmounts;
  },

  calculatePercentReceivingOvertimePay(
    overtimePayStats: GroupedColumnStats | null,
    refGenderCode: string,
  ): CalculatedAmount[] {
    let percentReceivingOvertimePayM = null;
    let percentReceivingOvertimePayW = null;
    let percentReceivingOvertimePayX = null;
    let percentReceivingOvertimePayU = null;

    if (overtimePayStats) {
      const countReceivingOvertimePayM = overtimePayStats.getCountNonZeros(
        GENDER_CODES.MALE[0],
      );
      const countReceivingOvertimePayW = overtimePayStats.getCountNonZeros(
        GENDER_CODES.FEMALE[0],
      );
      const countReceivingOvertimePayX = overtimePayStats.getCountNonZeros(
        GENDER_CODES.NON_BINARY[0],
      );
      const countReceivingOvertimePayU = overtimePayStats.getCountNonZeros(
        GENDER_CODES.UNKNOWN[0],
      );

      const countReceivingOvertimePayRefGender =
        overtimePayStats.getCountNonZeros(refGenderCode);
      const isSuppressedRefGender = !this.meetsPeopleCountThreshold(
        countReceivingOvertimePayRefGender,
      );

      const countAllM = overtimePayStats.getCountAll(GENDER_CODES.MALE[0]);
      const countAllW = overtimePayStats.getCountAll(GENDER_CODES.FEMALE[0]);
      const countAllX = overtimePayStats.getCountAll(
        GENDER_CODES.NON_BINARY[0],
      );
      const countAllU = overtimePayStats.getCountAll(GENDER_CODES.UNKNOWN[0]);

      const isSuppressedMale =
        isSuppressedRefGender ||
        !this.meetsPeopleCountThreshold(countReceivingOvertimePayM);
      const isSuppressedFemale =
        isSuppressedRefGender ||
        !this.meetsPeopleCountThreshold(countReceivingOvertimePayW);
      const isSuppressedNonBinary =
        isSuppressedRefGender ||
        !this.meetsPeopleCountThreshold(countReceivingOvertimePayX);
      const isSuppressedUnknown =
        isSuppressedRefGender ||
        !this.meetsPeopleCountThreshold(countReceivingOvertimePayU);

      if (!isSuppressedMale) {
        percentReceivingOvertimePayM =
          (countReceivingOvertimePayM / countAllM) * 100;
      }

      if (!isSuppressedFemale) {
        percentReceivingOvertimePayW =
          (countReceivingOvertimePayW / countAllW) * 100;
      }

      if (!isSuppressedNonBinary) {
        percentReceivingOvertimePayX =
          (countReceivingOvertimePayX / countAllX) * 100;
      }

      if (!isSuppressedUnknown) {
        percentReceivingOvertimePayU =
          (countReceivingOvertimePayU / countAllU) * 100;
      }
    }

    // If only one gender category has a non-null calculated amount,
    // reset all calculated amounts to null.
    if (
      reportCalcServicePrivate.countNonNulls([
        percentReceivingOvertimePayM,
        percentReceivingOvertimePayW,
        percentReceivingOvertimePayX,
        percentReceivingOvertimePayU,
      ]) < 2
    ) {
      percentReceivingOvertimePayM = null;
      percentReceivingOvertimePayW = null;
      percentReceivingOvertimePayX = null;
      percentReceivingOvertimePayU = null;
    }

    const calculatedAmounts = [];
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.PERCENT_RECEIVING_OT_PAY_M,
      value: percentReceivingOvertimePayM,
      isSuppressed: percentReceivingOvertimePayM === null,
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.PERCENT_RECEIVING_OT_PAY_W,
      value: percentReceivingOvertimePayW,
      isSuppressed: percentReceivingOvertimePayW === null,
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.PERCENT_RECEIVING_OT_PAY_X,
      value: percentReceivingOvertimePayX,
      isSuppressed: percentReceivingOvertimePayX === null,
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.PERCENT_RECEIVING_OT_PAY_U,
      value: percentReceivingOvertimePayU,
      isSuppressed: percentReceivingOvertimePayU === null,
    });

    return calculatedAmounts;
  },

  calculatePercentReceivingBonusPay(
    bonusPayStats: GroupedColumnStats | null,
    refGenderCode: string,
  ): CalculatedAmount[] {
    let percentReceivingBonusPayM = null;
    let percentReceivingBonusPayW = null;
    let percentReceivingBonusPayX = null;
    let percentReceivingBonusPayU = null;

    if (bonusPayStats) {
      const countReceivingBonusPayM = bonusPayStats.getCountNonZeros(
        GENDER_CODES.MALE[0],
      );
      const countReceivingBonusPayW = bonusPayStats.getCountNonZeros(
        GENDER_CODES.FEMALE[0],
      );
      const countReceivingBonusPayX = bonusPayStats.getCountNonZeros(
        GENDER_CODES.NON_BINARY[0],
      );
      const countReceivingBonusPayU = bonusPayStats.getCountNonZeros(
        GENDER_CODES.UNKNOWN[0],
      );

      const countReceivingBonusPayRefGender =
        bonusPayStats.getCountNonZeros(refGenderCode);
      const isSuppressedRefGender = !this.meetsPeopleCountThreshold(
        countReceivingBonusPayRefGender,
      );

      const countAllM = bonusPayStats.getCountAll(GENDER_CODES.MALE[0]);
      const countAllW = bonusPayStats.getCountAll(GENDER_CODES.FEMALE[0]);
      const countAllX = bonusPayStats.getCountAll(GENDER_CODES.NON_BINARY[0]);
      const countAllU = bonusPayStats.getCountAll(GENDER_CODES.UNKNOWN[0]);

      const isSuppressedMale =
        isSuppressedRefGender ||
        !this.meetsPeopleCountThreshold(countReceivingBonusPayM);
      const isSuppressedFemale =
        isSuppressedRefGender ||
        !this.meetsPeopleCountThreshold(countReceivingBonusPayW);
      const isSuppressedNonBinary =
        isSuppressedRefGender ||
        !this.meetsPeopleCountThreshold(countReceivingBonusPayX);
      const isSuppressedUnknown =
        isSuppressedRefGender ||
        !this.meetsPeopleCountThreshold(countReceivingBonusPayU);

      if (!isSuppressedMale) {
        percentReceivingBonusPayM = (countReceivingBonusPayM / countAllM) * 100;
      }

      if (!isSuppressedFemale) {
        percentReceivingBonusPayW = (countReceivingBonusPayW / countAllW) * 100;
      }

      if (!isSuppressedNonBinary) {
        percentReceivingBonusPayX = (countReceivingBonusPayX / countAllX) * 100;
      }

      if (!isSuppressedUnknown) {
        percentReceivingBonusPayU = (countReceivingBonusPayU / countAllU) * 100;
      }
    }

    // If only one gender category has a non-null calculated amount,
    // reset all calculated amounts to null.
    if (
      reportCalcServicePrivate.countNonNulls([
        percentReceivingBonusPayM,
        percentReceivingBonusPayW,
        percentReceivingBonusPayX,
        percentReceivingBonusPayU,
      ]) < 2
    ) {
      percentReceivingBonusPayM = null;
      percentReceivingBonusPayW = null;
      percentReceivingBonusPayX = null;
      percentReceivingBonusPayU = null;
    }

    const calculatedAmounts = [];
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.PERCENT_RECEIVING_BONUS_PAY_M,
      value: percentReceivingBonusPayM,
      isSuppressed: percentReceivingBonusPayM === null,
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.PERCENT_RECEIVING_BONUS_PAY_W,
      value: percentReceivingBonusPayW,
      isSuppressed: percentReceivingBonusPayW === null,
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.PERCENT_RECEIVING_BONUS_PAY_X,
      value: percentReceivingBonusPayX,
      isSuppressed: percentReceivingBonusPayX === null,
    });
    calculatedAmounts.push({
      calculationCode: CALCULATION_CODES.PERCENT_RECEIVING_BONUS_PAY_U,
      value: percentReceivingBonusPayU,
      isSuppressed: percentReceivingBonusPayU === null,
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
    Object.keys(csvRecord).forEach((col) => {
      if (NUMERIC_COLUMNS.indexOf(col) >= 0) {
        if (validateService.isZeroSynonym(csvRecord[col])) {
          csvRecord[col] = 0;
        } else {
          csvRecord[col] = parseFloat(csvRecord[col]);
        }
      }
    });
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
      throw new Error('csvRecord must be specified');
    }
    if (
      csvRecord[SUBMISSION_ROW_COLUMNS.ORDINARY_PAY] &&
      csvRecord[SUBMISSION_ROW_COLUMNS.HOURS_WORKED]
    ) {
      return (
        csvRecord[SUBMISSION_ROW_COLUMNS.ORDINARY_PAY] /
        csvRecord[SUBMISSION_ROW_COLUMNS.HOURS_WORKED]
      );
    }
    return csvRecord[SUBMISSION_ROW_COLUMNS.SPECIAL_SALARY];
  },
};

export {
  CalculatedAmount,
  CALCULATION_CODES,
  GroupedColumnStats,
  reportCalcService,
  reportCalcServicePrivate,
  TaggedColumnStats,
};
