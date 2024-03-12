import {
  CALCULATION_CODES,
  CalculatedAmount,
  GroupedColumnStats,
  TaggedColumnStats,
  reportCalcService,
  reportCalcServicePrivate,
} from './report-calc-service';
import { GENDER_CODES, SUBMISSION_ROW_COLUMNS } from './validate-service';
import { createSampleRecord } from './validate-service.spec';

describe('GroupedColumnStats', () => {
  // Initialize a GroupedColumnStats object with a sample dataset that will
  // be used for most tests on this class.
  let columnStats = null;
  // Add an equal number of non-binary people and people of
  // unknown gender.  In both cases the number should be at least
  // enough for the gender category to be included in graphs and
  // to be considered as a candidate for the reference category.
  const numNonBinary = Math.max(
    reportCalcService.MIN_REQUIRED_PEOPLE_COUNT_PER_GENDER,
    reportCalcService.MIN_REQUIRED_COUNT_FOR_REF_CATEGORY,
  );
  const numUnknownWithData = numNonBinary;
  const numUnknownWithoutData = 100;
  beforeEach(() => {
    columnStats = new GroupedColumnStats();
    columnStats.push(10, GENDER_CODES.FEMALE[0]);
    columnStats.push(24, GENDER_CODES.FEMALE[GENDER_CODES.FEMALE.length - 1]);
    columnStats.push(20, GENDER_CODES.FEMALE[0]);
    columnStats.push(40, GENDER_CODES.MALE[0]);
    columnStats.push(30, GENDER_CODES.MALE[0]);
    for (var i = 0; i < numNonBinary; i++) {
      columnStats.push(50, GENDER_CODES.NON_BINARY[0]);
    }
    for (var i = 0; i < numUnknownWithData; i++) {
      columnStats.push(60, GENDER_CODES.UNKNOWN[0]);
    }
    for (var i = 0; i < numUnknownWithoutData; i++) {
      columnStats.push(0, GENDER_CODES.UNKNOWN[0]);
    }
  });

  describe('sortEachGenderCategory', () => {
    it('sorts the data in each gender category list (in ascending order)', () => {
      const columnStats = new GroupedColumnStats();

      // Insert 3 mock values in unsorted order for the Male
      // gender category
      columnStats.push(10, GENDER_CODES.MALE[0]);
      columnStats.push(1, GENDER_CODES.MALE[0]);
      columnStats.push(3, GENDER_CODES.MALE[0]);

      columnStats.sortEachGenderCategory();

      // Confirm that the values are now sorted.
      // Iterate over the values, and check that each is larger than the previous
      const valuesM = columnStats.getNonZeroValues(GENDER_CODES.MALE[0]);
      let prev = null;
      valuesM.forEach((v) => {
        if (prev != null) {
          expect(v >= prev).toBeTruthy();
        }
        prev = v;
      });
    });
  });

  describe('getNonZeroValues', () => {
    it('returns a array of all values in the given gender category in the same order as input', () => {
      //Just check the lowest value in each gender category
      expect(columnStats.getNonZeroValues(GENDER_CODES.FEMALE[0])[0]).toBe(10);
      expect(columnStats.getNonZeroValues(GENDER_CODES.MALE[0])[0]).toBe(40);
      expect(columnStats.getNonZeroValues(GENDER_CODES.NON_BINARY[0])[0]).toBe(
        50,
      );
    });
  });

  describe('getCountAll', () => {
    it('returns the number of values in the given gender category', () => {
      expect(columnStats.getCountAll(GENDER_CODES.FEMALE[0])).toBe(3);
      expect(columnStats.getCountAll(GENDER_CODES.MALE[0])).toBe(2);
      expect(columnStats.getCountAll(GENDER_CODES.NON_BINARY[0])).toBe(
        numNonBinary,
      );
      expect(columnStats.getCountAll(GENDER_CODES.UNKNOWN[0])).toBe(
        numUnknownWithData + numUnknownWithoutData,
      );
    });
  });

  describe('getMeanOfNonZeros', () => {
    it('returns the mean (average) of all values in the given gender catetory', () => {
      expect(columnStats.getMeanOfNonZeros(GENDER_CODES.FEMALE[0])).toBe(18);
      expect(columnStats.getMeanOfNonZeros(GENDER_CODES.MALE[0])).toBe(35);
      expect(columnStats.getMeanOfNonZeros(GENDER_CODES.NON_BINARY[0])).toBe(
        50,
      );
      expect(columnStats.getMeanOfNonZeros(GENDER_CODES.UNKNOWN[0])).toBe(60);
    });
  });

  describe('getMedianOfNonZeros', () => {
    it('returns the median of non-zero values in the given gender catetory', () => {
      expect(columnStats.getMedianOfNonZeros(GENDER_CODES.FEMALE[0])).toBe(20);
      expect(columnStats.getMedianOfNonZeros(GENDER_CODES.MALE[0])).toBe(35);
      expect(columnStats.getMedianOfNonZeros(GENDER_CODES.NON_BINARY[0])).toBe(
        50,
      );
      expect(columnStats.getMedianOfNonZeros(GENDER_CODES.UNKNOWN[0])).toBe(60);
    });
  });

  describe('getReferenceGenderCode', () => {
    it('returns the expected reference category', () => {
      expect(columnStats.getReferenceGenderCode()).toBe(
        GENDER_CODES.UNKNOWN[0],
      );
    });
  });
});

describe('TaggedColumnStats', () => {
  // Initialize a TaggedColumnStats object with a sample dataset that will
  // be used for most tests on this class.
  let columnStats = null;

  const numMale = 10;
  const numFemale = 10;
  const numNonBinary = 10;
  const numUnknown = 10;
  const numEmployees = numMale + numFemale + numNonBinary + numUnknown;

  beforeEach(() => {
    columnStats = new TaggedColumnStats();
    for (var i = 0; i < numMale; i++) {
      columnStats.push(130, GENDER_CODES.MALE[0]);
    }
    for (var i = 0; i < numFemale; i++) {
      columnStats.push(120, GENDER_CODES.FEMALE[0]);
    }
    for (var i = 0; i < numNonBinary; i++) {
      columnStats.push(110, GENDER_CODES.NON_BINARY[0]);
    }
    for (var i = 0; i < numUnknown; i++) {
      columnStats.push(100, GENDER_CODES.UNKNOWN[0]);
    }
  });

  describe('getCount()', () => {
    it('returns the number of records that have been pushed', () => {
      expect(columnStats.getCount()).toBe(numEmployees);
    });
  });

  describe('getQuartileBreaks()', () => {
    describe('when the number of records is evenly divisible by 4', () => {
      it('returns break points that define 4 equal-width quartiles', () => {
        const breaks = columnStats.getQuartileBreaks();
        expect(breaks.length == 4);
        const widths = [];

        // Initialize the loop variable 'endIndex'
        // (the first quartile starts at 0, so if there was hypothetically
        // a quartile before that it would need to have an endIndex of -1)
        let endIndex = -1;

        breaks.forEach((b) => {
          expect(Number.isInteger(b)).toBeTruthy();
          const startIndex = endIndex + 1;
          endIndex = b;
          const width = endIndex - startIndex;
          widths.push(width);
        });
        expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(
          1,
        );
      });
    });
    describe('when the number of records is evenly divisible by 2, but not by 4', () => {
      it('returns break points defining Q1 and Q4 each containing one more record than Q2 and Q3', () => {
        // 174 employees in total. This number is not divisible by 4, so not all
        // quartiles will have the same width.
        const numMale = 70;
        const numFemale = 70;
        const numNonBinary = 4;
        const numUnknown = 30;

        columnStats = new TaggedColumnStats();
        for (var i = 0; i < numMale; i++) {
          columnStats.push(130, GENDER_CODES.MALE[0]);
        }
        for (var i = 0; i < numFemale; i++) {
          columnStats.push(120, GENDER_CODES.FEMALE[0]);
        }
        for (var i = 0; i < numNonBinary; i++) {
          columnStats.push(110, GENDER_CODES.NON_BINARY[0]);
        }
        for (var i = 0; i < numUnknown; i++) {
          columnStats.push(100, GENDER_CODES.UNKNOWN[0]);
        }

        const breaks = columnStats.getQuartileBreaks();
        expect(breaks.length == 4);

        const q1Width = breaks[0] + 1;
        const q2Width = breaks[1] - breaks[0];
        const q3Width = breaks[2] - breaks[1];
        const q4Width = breaks[3] - breaks[2];

        // Expect Q1 and Q4 to have equal width and to be
        // exactly one record wider than Q2 and Q3
        expect(q1Width).toBe(q4Width);
        expect(q2Width).toBe(q3Width);
        expect(q2Width).toBe(q1Width - 1);
      });
    });
    describe('when the number of records % 4 == 1', () => {
      it('returns break points in which Q1 has one more record than each of the other quartiles', () => {
        const numEmployees = 173;
        columnStats = new TaggedColumnStats();
        for (var i = 0; i < numEmployees; i++) {
          columnStats.push(130, GENDER_CODES.MALE[0]);
        }

        const breaks = columnStats.getQuartileBreaks();
        expect(breaks.length == 4);

        const q1Width = breaks[0] + 1;
        const q2Width = breaks[1] - breaks[0];
        const q3Width = breaks[2] - breaks[1];
        const q4Width = breaks[3] - breaks[2];

        expect(q1Width).toBe(q2Width + 1);
        expect(q2Width).toBe(q3Width);
        expect(q2Width).toBe(q4Width);
      });
    });
    describe('when the number of records % 4 == 3', () => {
      it('returns break points in which Q1 has one more record than each of the other quartiles', () => {
        const numEmployees = 171;
        columnStats = new TaggedColumnStats();
        for (var i = 0; i < numEmployees; i++) {
          columnStats.push(130, GENDER_CODES.MALE[0]);
        }

        const breaks = columnStats.getQuartileBreaks();
        expect(breaks.length == 4);

        const q1Width = breaks[0] + 1;
        const q2Width = breaks[1] - breaks[0];
        const q3Width = breaks[2] - breaks[1];
        const q4Width = breaks[3] - breaks[2];

        //Expect Q1, Q4 and Q2 are all equal width, and Q3 is one smaller
        expect(q1Width).toBe(q4Width);
        expect(q1Width).toBe(q2Width);
        expect(q3Width).toBe(q4Width - 1);
      });
    });
  });

  describe('getGenderCountsInRange()', () => {
    it('returns the number of employees of each gender code within the given data range', () => {
      const genderCounts = columnStats.getGenderCountsInRange(
        0,
        numEmployees - 1,
      );
      expect(genderCounts[GENDER_CODES.MALE[0]]).toBe(numMale);
      expect(genderCounts[GENDER_CODES.FEMALE[0]]).toBe(numFemale);
      expect(genderCounts[GENDER_CODES.NON_BINARY[0]]).toBe(numNonBinary);
      expect(genderCounts[GENDER_CODES.UNKNOWN[0]]).toBe(numUnknown);
    });
  });

  describe('getGenderCountsPerQuartile()', () => {
    it('returns an object breaking down the number of employees of each gender code in each quartile', () => {
      const quartiles = columnStats.getGenderCountsPerQuartile();

      // Expect only males in the top quartile
      expect(quartiles['Q4'][GENDER_CODES.MALE[0]]).toBe(numMale);
      expect(quartiles['Q4'][GENDER_CODES.FEMALE[0]]).toBeUndefined();
      expect(quartiles['Q4'][GENDER_CODES.NON_BINARY[0]]).toBeUndefined();
      expect(quartiles['Q4'][GENDER_CODES.UNKNOWN[0]]).toBeUndefined();

      // Expect only females in the migh-middle quartile
      expect(quartiles['Q3'][GENDER_CODES.MALE[0]]).toBeUndefined();
      expect(quartiles['Q3'][GENDER_CODES.FEMALE[0]]).toBe(numFemale);
      expect(quartiles['Q3'][GENDER_CODES.NON_BINARY[0]]).toBeUndefined();
      expect(quartiles['Q3'][GENDER_CODES.UNKNOWN[0]]).toBeUndefined();

      // Expect only people of unknown gender in the low-middle quartile
      expect(quartiles['Q2'][GENDER_CODES.MALE[0]]).toBeUndefined();
      expect(quartiles['Q2'][GENDER_CODES.FEMALE[0]]).toBeUndefined();
      expect(quartiles['Q2'][GENDER_CODES.NON_BINARY[0]]).toBe(numNonBinary);
      expect(quartiles['Q2'][GENDER_CODES.UNKNOWN[0]]).toBeUndefined();

      // Expect onlynon-binary people in the lowest quartile
      expect(quartiles['Q1'][GENDER_CODES.MALE[0]]).toBeUndefined();
      expect(quartiles['Q1'][GENDER_CODES.FEMALE[0]]).toBeUndefined();
      expect(quartiles['Q1'][GENDER_CODES.NON_BINARY[0]]).toBeUndefined();
      expect(quartiles['Q1'][GENDER_CODES.UNKNOWN[0]]).toBe(numUnknown);
    });
  });
});

describe('meetsPeopleCountThreshold', () => {
  describe(`when a gender group meets the people count threshold for calculations to be performed`, () => {
    it(`returns true`, () => {
      const columnStats = new GroupedColumnStats();
      Array(reportCalcService.MIN_REQUIRED_PEOPLE_COUNT_PER_GENDER)
        .fill(100)
        .forEach((v) => {
          columnStats.push(v, GENDER_CODES.FEMALE[0]);
        });
      const meetsThreshold = reportCalcServicePrivate.meetsPeopleCountThreshold(
        columnStats.getCountNonZeros(GENDER_CODES.FEMALE[0]),
      );
      expect(meetsThreshold).toBeTruthy();
    });
  });
  describe(`when a gender group doesn't meet the people count threshold for calculations to be performed`, () => {
    it(`returns false`, () => {
      const columnStats = new GroupedColumnStats();
      Array(reportCalcService.MIN_REQUIRED_PEOPLE_COUNT_PER_GENDER - 1)
        .fill(100)
        .forEach((v) => {
          columnStats.push(v, GENDER_CODES.FEMALE[0]);
        });
      const meetsThreshold = reportCalcServicePrivate.meetsPeopleCountThreshold(
        columnStats.getCountNonZeros(GENDER_CODES.FEMALE[0]),
      );
      expect(meetsThreshold).toBeFalsy();
    });
  });
});

describe('cleanCsvRecord', () => {
  describe(`when numeric columns have values represented as strings`, () => {
    it(`those values are converted into proper numbers`, () => {
      const overrides = {};
      overrides[SUBMISSION_ROW_COLUMNS.HOURS_WORKED] = '10';
      overrides[SUBMISSION_ROW_COLUMNS.ORDINARY_PAY] = '200';
      overrides[SUBMISSION_ROW_COLUMNS.SPECIAL_SALARY] = '';
      const record = createSampleRecord(overrides);
      const cleanedCsvRecord = reportCalcServicePrivate.cleanCsvRecord(record);
      expect(cleanedCsvRecord[SUBMISSION_ROW_COLUMNS.HOURS_WORKED]).toBe(
        parseFloat(overrides[SUBMISSION_ROW_COLUMNS.HOURS_WORKED]),
      );
      expect(cleanedCsvRecord[SUBMISSION_ROW_COLUMNS.ORDINARY_PAY]).toBe(
        parseFloat(overrides[SUBMISSION_ROW_COLUMNS.ORDINARY_PAY]),
      );
      expect(cleanedCsvRecord[SUBMISSION_ROW_COLUMNS.SPECIAL_SALARY]).toBe(0);
    });
  });
});

describe('getHourlyPayDollars', () => {
  describe(`when ${SUBMISSION_ROW_COLUMNS.HOURS_WORKED} and ${SUBMISSION_ROW_COLUMNS.ORDINARY_PAY} are specified`, () => {
    it(`hourly rate is ${SUBMISSION_ROW_COLUMNS.ORDINARY_PAY} divided by ${SUBMISSION_ROW_COLUMNS.HOURS_WORKED}`, () => {
      const overrides = {};
      overrides[SUBMISSION_ROW_COLUMNS.HOURS_WORKED] = '10';
      overrides[SUBMISSION_ROW_COLUMNS.ORDINARY_PAY] = '200';
      overrides[SUBMISSION_ROW_COLUMNS.SPECIAL_SALARY] = '';
      const record = createSampleRecord(overrides);
      // A precondition of getHourlyPayDollars(..) is:
      //  cleanCsvRecord(..) must be been called before it.
      // Do that now.
      const cleanedCsvRecord = reportCalcServicePrivate.cleanCsvRecord(record);
      const hourlyPayDollars =
        reportCalcServicePrivate.getHourlyPayDollars(cleanedCsvRecord);
      const expectedHourlyPayDollars =
        cleanedCsvRecord[SUBMISSION_ROW_COLUMNS.ORDINARY_PAY] /
        cleanedCsvRecord[SUBMISSION_ROW_COLUMNS.HOURS_WORKED];
      expect(hourlyPayDollars).toBe(expectedHourlyPayDollars);
    });
  });
  describe(`when ${SUBMISSION_ROW_COLUMNS.SPECIAL_SALARY} is specified`, () => {
    it(`hourly rate ${SUBMISSION_ROW_COLUMNS.SPECIAL_SALARY}`, () => {
      const overrides = {};
      overrides[SUBMISSION_ROW_COLUMNS.HOURS_WORKED] = '';
      overrides[SUBMISSION_ROW_COLUMNS.ORDINARY_PAY] = '';
      overrides[SUBMISSION_ROW_COLUMNS.SPECIAL_SALARY] = '100';
      const record = createSampleRecord(overrides);
      // A precondition of getHourlyPayDollars(..) is:
      //  cleanCsvRecord(..) must be been called before it.
      // Do that now.
      const cleanedCsvRecord = reportCalcServicePrivate.cleanCsvRecord(record);
      const hourlyPayDollars =
        reportCalcServicePrivate.getHourlyPayDollars(cleanedCsvRecord);
      const expectedHourlyPayDollars =
        cleanedCsvRecord[SUBMISSION_ROW_COLUMNS.SPECIAL_SALARY];
      expect(hourlyPayDollars).toBe(expectedHourlyPayDollars);
    });
  });
});

describe('countNonNulls', () => {
  describe(`given an array`, () => {
    it(`returns the correct number of non-null elements`, () => {
      const testArray = [1, null, 3, 4];
      const numNotNull = reportCalcServicePrivate.countNonNulls(testArray);
      expect(numNotNull).toBe(3);
    });
  });
});

describe('calculateMeanHourlyPayGaps', () => {
  describe(`given a simulated list of people with gender codes and hourly pay data`, () => {
    it(`mean gender hourly pay gaps are calculated correctly`, () => {
      // For these mock hourly pay data, assume:
      // - All males earn $100/hr
      // - All females earn $99/hr
      // - All non-binary people earn $98/hr
      // - All people whose gender is unknown earn $97/hr
      // Add 10 fake people in each gender category
      const hourlyPayStats = new GroupedColumnStats();
      Array(10)
        .fill(100)
        .forEach((v) => {
          hourlyPayStats.push(v, GENDER_CODES.MALE[0]);
          hourlyPayStats.push(v - 1, GENDER_CODES.FEMALE[0]);
          hourlyPayStats.push(v - 2, GENDER_CODES.NON_BINARY[0]);
          hourlyPayStats.push(v - 3, GENDER_CODES.UNKNOWN[0]);
        });
      const refGenderCode = GENDER_CODES.MALE[0];
      const means: CalculatedAmount[] =
        reportCalcServicePrivate.calculateMeanHourlyPayGaps(
          hourlyPayStats,
          refGenderCode,
        );

      expect(
        means.filter(
          (d) => d.calculationCode == CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_M,
        )[0].value,
      ).toBe(0);
      expect(
        means.filter(
          (d) => d.calculationCode == CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_W,
        )[0].value,
      ).toBe(1);
      expect(
        means.filter(
          (d) => d.calculationCode == CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_X,
        )[0].value,
      ).toBe(2);
      expect(
        means.filter(
          (d) => d.calculationCode == CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_U,
        )[0].value,
      ).toBe(3);
    });
  });
});

describe('calculateMedianHourlyPayGaps', () => {
  describe(`given a simulated list of people with gender codes and hourly pay data`, () => {
    it(`median gender hourly pay gaps are calculated correctly`, () => {
      // For these mock hourly pay data, assume:
      // - All males earn $100/hr
      // - All females earn $99/hr
      // - All non-binary people earn $98/hr
      // - All people whose gender is unknown earn $97/hr
      // Add 10 fake people in each gender category
      const hourlyPayStats = new GroupedColumnStats();
      Array(10)
        .fill(100)
        .forEach((v) => {
          hourlyPayStats.push(v, GENDER_CODES.MALE[0]);
          hourlyPayStats.push(v - 1, GENDER_CODES.FEMALE[0]);
          hourlyPayStats.push(v - 2, GENDER_CODES.NON_BINARY[0]);
          hourlyPayStats.push(v - 3, GENDER_CODES.UNKNOWN[0]);
        });
      const refGenderCode = GENDER_CODES.MALE[0];
      const medians: CalculatedAmount[] =
        reportCalcServicePrivate.calculateMedianHourlyPayGaps(
          hourlyPayStats,
          refGenderCode,
        );

      expect(
        medians.filter(
          (d) =>
            d.calculationCode == CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_M,
        )[0].value,
      ).toBe(0);
      expect(
        medians.filter(
          (d) =>
            d.calculationCode == CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_W,
        )[0].value,
      ).toBe(1);
      expect(
        medians.filter(
          (d) =>
            d.calculationCode == CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_X,
        )[0].value,
      ).toBe(2);
      expect(
        medians.filter(
          (d) =>
            d.calculationCode == CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_U,
        )[0].value,
      ).toBe(3);
    });
  });
});

describe('calculateMeanOvertimePayGaps', () => {
  describe(`given at least two gender categories have sufficient data for reporting mean OT pay`, () => {
    it(`mean gender overtime pay gaps are calculated correctly`, () => {
      // For these mock OT pay data, assume:
      // - All males earn $100/hr
      // - All females earn $99/hr
      // - All non-binary people earn $98/hr
      // - All people whose gender is unknown earn $97/hr
      // Add 10 fake people in each gender category
      const overtimePayStats = new GroupedColumnStats();
      Array(10)
        .fill(100)
        .forEach((v) => {
          overtimePayStats.push(v, GENDER_CODES.MALE[0]);
          overtimePayStats.push(v - 1, GENDER_CODES.FEMALE[0]);
          overtimePayStats.push(v - 2, GENDER_CODES.NON_BINARY[0]);
          overtimePayStats.push(v - 3, GENDER_CODES.UNKNOWN[0]);
        });
      const refGenderCode = GENDER_CODES.MALE[0];
      const means: CalculatedAmount[] =
        reportCalcServicePrivate.calculateMeanOvertimePayGaps(
          overtimePayStats,
          refGenderCode,
        );

      expect(
        means.filter(
          (d) => d.calculationCode == CALCULATION_CODES.MEAN_OT_PAY_DIFF_M,
        )[0].value,
      ).toBe(0);
      expect(
        means.filter(
          (d) => d.calculationCode == CALCULATION_CODES.MEAN_OT_PAY_DIFF_W,
        )[0].value,
      ).toBe(1);
      expect(
        means.filter(
          (d) => d.calculationCode == CALCULATION_CODES.MEAN_OT_PAY_DIFF_X,
        )[0].value,
      ).toBe(2);
      expect(
        means.filter(
          (d) => d.calculationCode == CALCULATION_CODES.MEAN_OT_PAY_DIFF_U,
        )[0].value,
      ).toBe(3);
    });
  });
  describe(`given only one gender category has sufficient data for reporting mean OT pay`, () => {
    it(`all mean OT pay calculations are suppressed`, () => {
      // For these mock OT pay data, assume:
      // - there are 10 males (each earning $100/hr in OT pay)
      // - there are 9 people in each of the other gender categories (each earning $100/hr in OT pay)
      const overtimePayStats = new GroupedColumnStats();
      Array(10)
        .fill(100)
        .forEach((v) => {
          overtimePayStats.push(v, GENDER_CODES.MALE[0]);
        });
      Array(9)
        .fill(100)
        .forEach((v) => {
          overtimePayStats.push(v, GENDER_CODES.FEMALE[0]);
          overtimePayStats.push(v, GENDER_CODES.NON_BINARY[0]);
          overtimePayStats.push(v, GENDER_CODES.UNKNOWN[0]);
        });
      const refGenderCode = GENDER_CODES.MALE[0];
      const means: CalculatedAmount[] =
        reportCalcServicePrivate.calculateMeanOvertimePayGaps(
          overtimePayStats,
          refGenderCode,
        );

      expect(means.filter((d) => !d.isSuppressed).length).toBe(0);
      expect(means.filter((d) => d.value !== null).length).toBe(0);
    });
  });
});

describe('calculateMedianOvertimePayGaps', () => {
  describe(`given a simulated list of people with gender codes and overtime pay data`, () => {
    it(` median gender overtime pay gaps are calculated correctly`, () => {
      // For these mock overtime pay data, assume:
      // - All males earn $100/hr for overtime
      // - All females earn $99/hr for overtime
      // - All non-binary people earn $98/hr for overtime
      // - All people whose gender is unknown earn $97/hr for overtime
      // Add 10 fake people in each gender category
      const overtimePayStats = new GroupedColumnStats();
      Array(10)
        .fill(100)
        .forEach((v) => {
          overtimePayStats.push(v, GENDER_CODES.MALE[0]);
          overtimePayStats.push(v - 1, GENDER_CODES.FEMALE[0]);
          overtimePayStats.push(v - 2, GENDER_CODES.NON_BINARY[0]);
          overtimePayStats.push(v - 3, GENDER_CODES.UNKNOWN[0]);
        });
      const refGenderCode = GENDER_CODES.MALE[0];
      const medians: CalculatedAmount[] =
        reportCalcServicePrivate.calculateMedianOvertimePayGaps(
          overtimePayStats,
          refGenderCode,
        );

      expect(
        medians.filter(
          (d) => d.calculationCode == CALCULATION_CODES.MEDIAN_OT_PAY_DIFF_M,
        )[0].value,
      ).toBe(0);
      expect(
        medians.filter(
          (d) => d.calculationCode == CALCULATION_CODES.MEDIAN_OT_PAY_DIFF_W,
        )[0].value,
      ).toBe(1);
      expect(
        medians.filter(
          (d) => d.calculationCode == CALCULATION_CODES.MEDIAN_OT_PAY_DIFF_X,
        )[0].value,
      ).toBe(2);
      expect(
        medians.filter(
          (d) => d.calculationCode == CALCULATION_CODES.MEDIAN_OT_PAY_DIFF_U,
        )[0].value,
      ).toBe(3);
    });
  });
  describe(`given only one gender category has sufficient data for reporting median OT pay`, () => {
    it(`all median OT pay calculations are suppressed`, () => {
      // For these mock OT pay data, assume:
      // - there are 10 males (each earning $100/hr in OT pay)
      // - there are 9 people in each of the other gender categories (each earning $100/hr in OT pay)
      const overtimePayStats = new GroupedColumnStats();
      Array(10)
        .fill(100)
        .forEach((v) => {
          overtimePayStats.push(v, GENDER_CODES.MALE[0]);
        });
      Array(9)
        .fill(100)
        .forEach((v) => {
          overtimePayStats.push(v, GENDER_CODES.FEMALE[0]);
          overtimePayStats.push(v, GENDER_CODES.NON_BINARY[0]);
          overtimePayStats.push(v, GENDER_CODES.UNKNOWN[0]);
        });
      const refGenderCode = GENDER_CODES.MALE[0];
      const medians: CalculatedAmount[] =
        reportCalcServicePrivate.calculateMedianOvertimePayGaps(
          overtimePayStats,
          refGenderCode,
        );

      expect(medians.filter((d) => !d.isSuppressed).length).toBe(0);
      expect(medians.filter((d) => d.value !== null).length).toBe(0);
    });
  });
});

describe('calculateMeanOvertimeHoursGaps', () => {
  describe(`given a simulated list of people with gender codes and overtime hours data`, () => {
    it(`mean gender overtime hours gaps are calculated correctly`, () => {
      // For these mock overtime hours data, assume:
      // - All males work 100 OT hours
      // - All females work 99 OT hours
      // - All non-binary people work 102 OT hours
      // - All people whose gender is unknown work 97 OT hours
      // Add 10 fake people in each gender category
      const overtimeHoursStats = new GroupedColumnStats();
      Array(10)
        .fill(100)
        .forEach((v) => {
          overtimeHoursStats.push(v, GENDER_CODES.MALE[0]);
          overtimeHoursStats.push(v - 1, GENDER_CODES.FEMALE[0]);
          overtimeHoursStats.push(v + 2, GENDER_CODES.NON_BINARY[0]);
          overtimeHoursStats.push(v - 3, GENDER_CODES.UNKNOWN[0]);
        });
      const refGenderCode = GENDER_CODES.MALE[0];
      const means: CalculatedAmount[] =
        reportCalcServicePrivate.calculateMeanOvertimeHoursGaps(
          overtimeHoursStats,
          refGenderCode,
        );

      expect(
        means.filter(
          (d) => d.calculationCode == CALCULATION_CODES.MEAN_OT_HOURS_DIFF_M,
        )[0].value,
      ).toBe(0);
      expect(
        means.filter(
          (d) => d.calculationCode == CALCULATION_CODES.MEAN_OT_HOURS_DIFF_W,
        )[0].value,
      ).toBe(-1);
      expect(
        means.filter(
          (d) => d.calculationCode == CALCULATION_CODES.MEAN_OT_HOURS_DIFF_X,
        )[0].value,
      ).toBe(2);
      expect(
        means.filter(
          (d) => d.calculationCode == CALCULATION_CODES.MEAN_OT_HOURS_DIFF_U,
        )[0].value,
      ).toBe(-3);
    });
  });
});

describe('calculateMedianOvertimeHoursGaps', () => {
  describe(`given a simulated list of people with gender codes and overtime hours data`, () => {
    it(` median gender overtime hours gaps are calculated correctly`, () => {
      // For these mock overtime hours data, assume:
      // - All males work 100 OT hours
      // - All females work 99 OT hours
      // - All non-binary people work 102 OT hours
      // - All people whose gender is unknown work 97 OT hours
      // Add 10 fake people in each gender category
      const overtimeHoursStats = new GroupedColumnStats();
      Array(10)
        .fill(100)
        .forEach((v) => {
          overtimeHoursStats.push(v, GENDER_CODES.MALE[0]);
          overtimeHoursStats.push(v - 1, GENDER_CODES.FEMALE[0]);
          overtimeHoursStats.push(v + 2, GENDER_CODES.NON_BINARY[0]);
          overtimeHoursStats.push(v - 3, GENDER_CODES.UNKNOWN[0]);
        });
      const refGenderCode = GENDER_CODES.MALE[0];
      const medians: CalculatedAmount[] =
        reportCalcServicePrivate.calculateMedianOvertimeHoursGaps(
          overtimeHoursStats,
          refGenderCode,
        );

      expect(
        medians.filter(
          (d) => d.calculationCode == CALCULATION_CODES.MEDIAN_OT_HOURS_DIFF_M,
        )[0].value,
      ).toBe(0);
      expect(
        medians.filter(
          (d) => d.calculationCode == CALCULATION_CODES.MEDIAN_OT_HOURS_DIFF_W,
        )[0].value,
      ).toBe(-1);
      expect(
        medians.filter(
          (d) => d.calculationCode == CALCULATION_CODES.MEDIAN_OT_HOURS_DIFF_X,
        )[0].value,
      ).toBe(2);
      expect(
        medians.filter(
          (d) => d.calculationCode == CALCULATION_CODES.MEDIAN_OT_HOURS_DIFF_U,
        )[0].value,
      ).toBe(-3);
    });
  });
});

describe('calculateMeanBonusPayGaps', () => {
  describe(`given at least two gender categories have sufficient data for reporting mean bonus pay`, () => {
    it(`mean gender bonus pay gaps are calculated correctly`, () => {
      // For these mock bonus pay data, assume:
      // - All males earn $1000 in annual bonus pay
      // - All females earn $990 in annual bonus pay
      // - All non-binary people earn $980 in annual bonus pay
      // - All people whose gender is unknown earn $970 in annual bonus pay
      // Add 10 fake people in each gender category
      const bonusPayStats = new GroupedColumnStats();
      Array(10)
        .fill(1000)
        .forEach((v) => {
          bonusPayStats.push(v, GENDER_CODES.MALE[0]);
          bonusPayStats.push(v - 10, GENDER_CODES.FEMALE[0]);
          bonusPayStats.push(v - 20, GENDER_CODES.NON_BINARY[0]);
          bonusPayStats.push(v - 30, GENDER_CODES.UNKNOWN[0]);
        });
      const refGenderCode = GENDER_CODES.MALE[0];
      const means: CalculatedAmount[] =
        reportCalcServicePrivate.calculateMeanBonusPayGaps(
          bonusPayStats,
          refGenderCode,
        );

      expect(
        means.filter(
          (d) => d.calculationCode == CALCULATION_CODES.MEAN_BONUS_PAY_DIFF_M,
        )[0].value,
      ).toBe(0);
      expect(
        means.filter(
          (d) => d.calculationCode == CALCULATION_CODES.MEAN_BONUS_PAY_DIFF_W,
        )[0].value,
      ).toBe(1);
      expect(
        means.filter(
          (d) => d.calculationCode == CALCULATION_CODES.MEAN_BONUS_PAY_DIFF_X,
        )[0].value,
      ).toBe(2);
      expect(
        means.filter(
          (d) => d.calculationCode == CALCULATION_CODES.MEAN_BONUS_PAY_DIFF_U,
        )[0].value,
      ).toBe(3);
    });
  });
  describe(`given only one gender category has sufficient data for reporting mean bonus pay`, () => {
    it(`all mean bonus pay calculations are suppressed `, () => {
      // For these mock bonus pay data, assume:
      // - there are 10 males (each earning $100/hr in bonus pay)
      // - there are 9 people in each of the other gender categories (each earning $100/hr in bonus pay)
      const bonusPayStats = new GroupedColumnStats();
      Array(10)
        .fill(100)
        .forEach((v) => {
          bonusPayStats.push(v, GENDER_CODES.MALE[0]);
        });
      Array(9)
        .fill(100)
        .forEach((v) => {
          bonusPayStats.push(v, GENDER_CODES.FEMALE[0]);
          bonusPayStats.push(v, GENDER_CODES.NON_BINARY[0]);
          bonusPayStats.push(v, GENDER_CODES.UNKNOWN[0]);
        });
      const refGenderCode = GENDER_CODES.MALE[0];
      const means: CalculatedAmount[] =
        reportCalcServicePrivate.calculateMeanBonusPayGaps(
          bonusPayStats,
          refGenderCode,
        );

      expect(means.filter((d) => !d.isSuppressed).length).toBe(0);
      expect(means.filter((d) => d.value !== null).length).toBe(0);
    });
  });
});

describe('calculateMedianBonusPayGaps', () => {
  describe(`given at least two gender categories have sufficient data for reporting median bonus pay`, () => {
    it(`median gender bonus pay gaps are calculated correctly`, () => {
      // For these mock bonus pay data, assume:
      // - All males earn $1000 in annual bonus pay
      // - All females earn $990 in annual bonus pay
      // - All non-binary people earn $980 in annual bonus pay
      // - All people whose gender is unknown earn $970 in annual bonus pay
      // Add 10 fake people in each gender category
      const bonusPayStats = new GroupedColumnStats();
      Array(10)
        .fill(1000)
        .forEach((v) => {
          bonusPayStats.push(v, GENDER_CODES.MALE[0]);
          bonusPayStats.push(v - 10, GENDER_CODES.FEMALE[0]);
          bonusPayStats.push(v - 20, GENDER_CODES.NON_BINARY[0]);
          bonusPayStats.push(v - 30, GENDER_CODES.UNKNOWN[0]);
        });
      const refGenderCode = GENDER_CODES.MALE[0];
      const medians: CalculatedAmount[] =
        reportCalcServicePrivate.calculateMedianBonusPayGaps(
          bonusPayStats,
          refGenderCode,
        );

      expect(
        medians.filter(
          (d) => d.calculationCode == CALCULATION_CODES.MEDIAN_BONUS_PAY_DIFF_M,
        )[0].value,
      ).toBe(0);
      expect(
        medians.filter(
          (d) => d.calculationCode == CALCULATION_CODES.MEDIAN_BONUS_PAY_DIFF_W,
        )[0].value,
      ).toBe(1);
      expect(
        medians.filter(
          (d) => d.calculationCode == CALCULATION_CODES.MEDIAN_BONUS_PAY_DIFF_X,
        )[0].value,
      ).toBe(2);
      expect(
        medians.filter(
          (d) => d.calculationCode == CALCULATION_CODES.MEDIAN_BONUS_PAY_DIFF_U,
        )[0].value,
      ).toBe(3);
    });
  });
  describe(`given only one gender category has sufficient data for reporting median bonus pay`, () => {
    it(`all median bonus pay calculations are suppressed `, () => {
      // For these mock bonus pay data, assume:
      // - there are 10 males (each earning $100/hr in bonus pay)
      // - there are 9 people in each of the other gender categories (each earning $100/hr in bonus pay)
      const bonusPayStats = new GroupedColumnStats();
      Array(10)
        .fill(100)
        .forEach((v) => {
          bonusPayStats.push(v, GENDER_CODES.MALE[0]);
        });
      Array(9)
        .fill(100)
        .forEach((v) => {
          bonusPayStats.push(v, GENDER_CODES.FEMALE[0]);
          bonusPayStats.push(v, GENDER_CODES.NON_BINARY[0]);
          bonusPayStats.push(v, GENDER_CODES.UNKNOWN[0]);
        });
      const refGenderCode = GENDER_CODES.MALE[0];
      const medians: CalculatedAmount[] =
        reportCalcServicePrivate.calculateMedianBonusPayGaps(
          bonusPayStats,
          refGenderCode,
        );

      expect(medians.filter((d) => !d.isSuppressed).length).toBe(0);
      expect(medians.filter((d) => d.value !== null).length).toBe(0);
    });
  });
});

describe('calculateHourlyPayQuartiles', () => {
  describe(`given a simulated list of people with gender codes and hourly pay data (scenario 1)`, () => {
    it(`hourly pay percents per quartile are calculated correctly`, () => {
      // For these mock hourly pay data, assume:
      // - All males earn $100/hr
      // - All females earn $99/hr
      // - All non-binary people earn $98/hr
      // - All people whose gender is unknown earn $97/hr
      // Add 10 fake people in each gender category
      const hourlyPayStats = new TaggedColumnStats();
      Array(10)
        .fill(100)
        .forEach((v) => {
          hourlyPayStats.push(v, GENDER_CODES.MALE[0]);
          hourlyPayStats.push(v - 1, GENDER_CODES.FEMALE[0]);
          hourlyPayStats.push(v - 2, GENDER_CODES.NON_BINARY[0]);
          hourlyPayStats.push(v - 3, GENDER_CODES.UNKNOWN[0]);
        });

      const calcs: CalculatedAmount[] =
        reportCalcServicePrivate.calculateHourlyPayQuartiles(hourlyPayStats);

      expect(
        calcs.filter(
          (d) =>
            d.calculationCode ==
            CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_1_M,
        )[0].value,
      ).toBe(null);
      expect(
        calcs.filter(
          (d) =>
            d.calculationCode ==
            CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_1_W,
        )[0].value,
      ).toBe(null);
      expect(
        calcs.filter(
          (d) =>
            d.calculationCode ==
            CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_1_X,
        )[0].value,
      ).toBe(null);
      expect(
        calcs.filter(
          (d) =>
            d.calculationCode ==
            CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_1_U,
        )[0].value,
      ).toBe(100);

      expect(
        calcs.filter(
          (d) =>
            d.calculationCode ==
            CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_2_M,
        )[0].value,
      ).toBe(null);
      expect(
        calcs.filter(
          (d) =>
            d.calculationCode ==
            CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_2_W,
        )[0].value,
      ).toBe(null);
      expect(
        calcs.filter(
          (d) =>
            d.calculationCode ==
            CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_2_X,
        )[0].value,
      ).toBe(100);
      expect(
        calcs.filter(
          (d) =>
            d.calculationCode ==
            CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_2_U,
        )[0].value,
      ).toBe(null);

      expect(
        calcs.filter(
          (d) =>
            d.calculationCode ==
            CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_3_M,
        )[0].value,
      ).toBe(null);
      expect(
        calcs.filter(
          (d) =>
            d.calculationCode ==
            CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_3_W,
        )[0].value,
      ).toBe(100);
      expect(
        calcs.filter(
          (d) =>
            d.calculationCode ==
            CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_3_X,
        )[0].value,
      ).toBe(null);
      expect(
        calcs.filter(
          (d) =>
            d.calculationCode ==
            CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_3_U,
        )[0].value,
      ).toBe(null);

      expect(
        calcs.filter(
          (d) =>
            d.calculationCode ==
            CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_4_M,
        )[0].value,
      ).toBe(100);
      expect(
        calcs.filter(
          (d) =>
            d.calculationCode ==
            CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_4_W,
        )[0].value,
      ).toBe(null);
      expect(
        calcs.filter(
          (d) =>
            d.calculationCode ==
            CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_4_X,
        )[0].value,
      ).toBe(null);
      expect(
        calcs.filter(
          (d) =>
            d.calculationCode ==
            CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_4_U,
        )[0].value,
      ).toBe(null);
    });
  });

  describe(`given a simulated list of people with gender codes and hourly pay data (scenario 2)`, () => {
    it(`hourly pay percents per quartile are calculated correctly`, () => {
      // For these mock hourly pay data, assume:
      // - 10 people from each gender group earn $50/hr (40 people in total earn this amount)
      // - 10 people from each gender group earn $40/hr (40 people in total earn this amount)
      // - 10 people from each gender group earn $30/hr (40 people in total earn this amount)
      // - 10 people from each gender group earn $20/hr (40 people in total earn this amount)
      const hourlyPayStats = new TaggedColumnStats();
      const primaryGenderCodes = Object.values(GENDER_CODES).map(
        (arr) => arr[0],
      );
      const payLevels = [50, 40, 30, 20];
      primaryGenderCodes.forEach((genderCode) => {
        payLevels.forEach((hourlyPay) => {
          for (let i = 0; i < 10; i++) {
            hourlyPayStats.push(hourlyPay, genderCode);
          }
        });
      });

      const calcs: CalculatedAmount[] =
        reportCalcServicePrivate.calculateHourlyPayQuartiles(hourlyPayStats);

      // Expect each gender group to represent 25% of each quartile
      expect(
        calcs.filter(
          (d) =>
            d.calculationCode ==
            CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_1_M,
        )[0].value,
      ).toBe(25);
      expect(
        calcs.filter(
          (d) =>
            d.calculationCode ==
            CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_1_W,
        )[0].value,
      ).toBe(25);
      expect(
        calcs.filter(
          (d) =>
            d.calculationCode ==
            CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_1_X,
        )[0].value,
      ).toBe(25);
      expect(
        calcs.filter(
          (d) =>
            d.calculationCode ==
            CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_1_U,
        )[0].value,
      ).toBe(25);

      expect(
        calcs.filter(
          (d) =>
            d.calculationCode ==
            CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_2_M,
        )[0].value,
      ).toBe(25);
      expect(
        calcs.filter(
          (d) =>
            d.calculationCode ==
            CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_2_W,
        )[0].value,
      ).toBe(25);
      expect(
        calcs.filter(
          (d) =>
            d.calculationCode ==
            CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_2_X,
        )[0].value,
      ).toBe(25);
      expect(
        calcs.filter(
          (d) =>
            d.calculationCode ==
            CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_2_U,
        )[0].value,
      ).toBe(25);

      expect(
        calcs.filter(
          (d) =>
            d.calculationCode ==
            CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_3_M,
        )[0].value,
      ).toBe(25);
      expect(
        calcs.filter(
          (d) =>
            d.calculationCode ==
            CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_3_W,
        )[0].value,
      ).toBe(25);
      expect(
        calcs.filter(
          (d) =>
            d.calculationCode ==
            CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_3_X,
        )[0].value,
      ).toBe(25);
      expect(
        calcs.filter(
          (d) =>
            d.calculationCode ==
            CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_3_U,
        )[0].value,
      ).toBe(25);

      expect(
        calcs.filter(
          (d) =>
            d.calculationCode ==
            CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_4_M,
        )[0].value,
      ).toBe(25);
      expect(
        calcs.filter(
          (d) =>
            d.calculationCode ==
            CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_4_W,
        )[0].value,
      ).toBe(25);
      expect(
        calcs.filter(
          (d) =>
            d.calculationCode ==
            CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_4_X,
        )[0].value,
      ).toBe(25);
      expect(
        calcs.filter(
          (d) =>
            d.calculationCode ==
            CALCULATION_CODES.HOURLY_PAY_PERCENT_QUARTILE_4_U,
        )[0].value,
      ).toBe(25);
    });
  });
});

describe('calculatePercentReceivingOvertimePay', () => {
  describe(`given a simulated list of people with gender codes and overtime pay data`, () => {
    it(`calculates the % of people in each gender category who received overtime pay`, () => {
      // For these mock overtime pay data, assume:
      // - there are 100 males.  50 of them earned 1000 (each) in OT pay, and the other 50 earned no OT pay
      // - there are 40 females.  10 of them earned 1500 (each) in OT pay, and the other 30 earned no OT pay
      // - there are zero non-binary people.
      // - there are 10 people of unknown gender.  9 of them earned 1200 (each) in OT pay, and the other 1 earned no OT pay
      const overtimePayStats = new GroupedColumnStats();
      //Male
      for (let i = 0; i < 50; i++) {
        overtimePayStats.push(1000, GENDER_CODES.MALE[0]);
        overtimePayStats.push(0, GENDER_CODES.MALE[0]);
      }
      //Female
      for (let i = 0; i < 10; i++) {
        overtimePayStats.push(1500, GENDER_CODES.FEMALE[0]);
      }
      for (let i = 0; i < 30; i++) {
        overtimePayStats.push(0, GENDER_CODES.FEMALE[0]);
      }
      //Unknown
      for (let i = 0; i < 9; i++) {
        overtimePayStats.push(1200, GENDER_CODES.UNKNOWN[0]);
      }
      overtimePayStats.push(0, GENDER_CODES.UNKNOWN[0]);

      const refGenderCode = GENDER_CODES.MALE[0];

      const calcs: CalculatedAmount[] =
        reportCalcServicePrivate.calculatePercentReceivingOvertimePay(
          overtimePayStats,
          refGenderCode,
        );

      expect(
        calcs.filter(
          (d) =>
            d.calculationCode == CALCULATION_CODES.PERCENT_RECEIVING_OT_PAY_M,
        )[0].value,
      ).toBe(50);
      expect(
        calcs.filter(
          (d) =>
            d.calculationCode == CALCULATION_CODES.PERCENT_RECEIVING_OT_PAY_W,
        )[0].value,
      ).toBe(25);
      expect(
        calcs.filter(
          (d) =>
            d.calculationCode == CALCULATION_CODES.PERCENT_RECEIVING_OT_PAY_X,
        )[0].value,
      ).toBeNull();
      expect(
        calcs.filter(
          (d) =>
            d.calculationCode == CALCULATION_CODES.PERCENT_RECEIVING_OT_PAY_U,
        )[0].value,
      ).toBeNull();
    });
  });
  describe(`given a data in which the reference gender should be suppressed`, () => {
    it(`calculations for all genders are suppressed`, () => {
      // For these mock overtime pay data, assume:
      // - there are 9 males.  all received 1000 each.
      // - there are 40 females.  10 of them earned 1500 (each) in OT pay, and the other 30 earned no OT pay
      // - there are zero non-binary people.
      // - there are 10 people of unknown gender.  9 of them earned 1200 (each) in OT pay, and the other 1 earned no OT pay
      const overtimePayStats = new GroupedColumnStats();
      //Male
      for (let i = 0; i < 9; i++) {
        overtimePayStats.push(1000, GENDER_CODES.MALE[0]);
      }
      //Female
      for (let i = 0; i < 10; i++) {
        overtimePayStats.push(1500, GENDER_CODES.FEMALE[0]);
      }
      for (let i = 0; i < 30; i++) {
        overtimePayStats.push(0, GENDER_CODES.FEMALE[0]);
      }
      //Unknown
      for (let i = 0; i < 9; i++) {
        overtimePayStats.push(1200, GENDER_CODES.UNKNOWN[0]);
      }
      overtimePayStats.push(0, GENDER_CODES.UNKNOWN[0]);

      const refGenderCode = GENDER_CODES.MALE[0];

      const calcs: CalculatedAmount[] =
        reportCalcServicePrivate.calculatePercentReceivingOvertimePay(
          overtimePayStats,
          refGenderCode,
        );

      calcs.forEach((c) => {
        expect(c.value).toBeNull();
        expect(c.isSuppressed).toBeTruthy();
      });
    });
  });
  describe(`given data in which only the ref gender has more than 10 people earning OT pay`, () => {
    it(`calculations for all genders are suppressed`, () => {
      // For these mock OT pay data, assume:
      // - there are 50 males.  all receive 1000 each in OT pay
      // - there are 9 females.  all of them earned 1500 (each) in OT pay
      // - there are zero non-binary people.
      // - there are 9 people of unknown gender.  all of them earned 1200 (each) in OT pay
      const overtimePayStats = new GroupedColumnStats();
      //Male
      for (let i = 0; i < 50; i++) {
        overtimePayStats.push(1000, GENDER_CODES.MALE[0]);
      }
      //Female
      for (let i = 0; i < 9; i++) {
        overtimePayStats.push(1500, GENDER_CODES.FEMALE[0]);
      }
      //Unknown
      for (let i = 0; i < 9; i++) {
        overtimePayStats.push(1200, GENDER_CODES.UNKNOWN[0]);
      }
      overtimePayStats.push(0, GENDER_CODES.UNKNOWN[0]);

      const refGenderCode = GENDER_CODES.MALE[0];

      const calcs: CalculatedAmount[] =
        reportCalcServicePrivate.calculatePercentReceivingBonusPay(
          overtimePayStats,
          refGenderCode,
        );

      calcs.forEach((c) => {
        expect(c.value).toBeNull();
        expect(c.isSuppressed).toBeTruthy();
      });
    });
  });
});

describe('calculatePercentReceivingBonusPay', () => {
  describe(`given a simulated list of people with gender codes and bonus pay data`, () => {
    it(`calculates the % of people in each gender category who received bonus pay`, () => {
      // For these mock bonus pay data, assume:
      // - there are 100 males.  50 of them earned 1000 (each) in bonus pay, and the other 50 earned no bonus pay
      // - there are 40 females.  10 of them earned 1500 (each) in bonus pay, and the other 30 earned no bonus pay
      // - there are zero non-binary people.
      // - there are 10 people of unknown gender.  9 of them earned 1200 (each) in bonus pay, and the other 1 earned no bonus pay
      const bonusPayStats = new GroupedColumnStats();
      //Male
      for (let i = 0; i < 50; i++) {
        bonusPayStats.push(1000, GENDER_CODES.MALE[0]);
        bonusPayStats.push(0, GENDER_CODES.MALE[0]);
      }
      //Female
      for (let i = 0; i < 10; i++) {
        bonusPayStats.push(1500, GENDER_CODES.FEMALE[0]);
      }
      for (let i = 0; i < 30; i++) {
        bonusPayStats.push(0, GENDER_CODES.FEMALE[0]);
      }
      //Unknown
      for (let i = 0; i < 9; i++) {
        bonusPayStats.push(1200, GENDER_CODES.UNKNOWN[0]);
      }
      bonusPayStats.push(0, GENDER_CODES.UNKNOWN[0]);

      const refGenderCode = GENDER_CODES.MALE[0];

      const calcs: CalculatedAmount[] =
        reportCalcServicePrivate.calculatePercentReceivingBonusPay(
          bonusPayStats,
          refGenderCode,
        );

      expect(
        calcs.filter(
          (d) =>
            d.calculationCode ==
            CALCULATION_CODES.PERCENT_RECEIVING_BONUS_PAY_M,
        )[0].value,
      ).toBe(50);
      expect(
        calcs.filter(
          (d) =>
            d.calculationCode ==
            CALCULATION_CODES.PERCENT_RECEIVING_BONUS_PAY_W,
        )[0].value,
      ).toBe(25);
      expect(
        calcs.filter(
          (d) =>
            d.calculationCode ==
            CALCULATION_CODES.PERCENT_RECEIVING_BONUS_PAY_X,
        )[0].value,
      ).toBeNull();
      expect(
        calcs.filter(
          (d) =>
            d.calculationCode ==
            CALCULATION_CODES.PERCENT_RECEIVING_BONUS_PAY_U,
        )[0].value,
      ).toBeNull();
    });
  });
  describe(`given data in which the reference gender should be suppressed`, () => {
    it(`calculations for all genders are suppressed`, () => {
      // For these mock bonus pay data, assume:
      // - there are 9 males.  all receive 1000 each in bonus pay
      // - there are 40 females.  10 of them earned 1500 (each) in bonus pay, and the other 30 earned no bonus pay
      // - there are zero non-binary people.
      // - there are 10 people of unknown gender.  9 of them earned 1200 (each) in bonus pay, and the other 1 earned no bonus pay
      const bonusPayStats = new GroupedColumnStats();
      //Male
      for (let i = 0; i < 9; i++) {
        bonusPayStats.push(1000, GENDER_CODES.MALE[0]);
        bonusPayStats.push(0, GENDER_CODES.MALE[0]);
      }
      //Female
      for (let i = 0; i < 10; i++) {
        bonusPayStats.push(1500, GENDER_CODES.FEMALE[0]);
      }
      for (let i = 0; i < 30; i++) {
        bonusPayStats.push(0, GENDER_CODES.FEMALE[0]);
      }
      //Unknown
      for (let i = 0; i < 9; i++) {
        bonusPayStats.push(1200, GENDER_CODES.UNKNOWN[0]);
      }
      bonusPayStats.push(0, GENDER_CODES.UNKNOWN[0]);

      const refGenderCode = GENDER_CODES.MALE[0];

      const calcs: CalculatedAmount[] =
        reportCalcServicePrivate.calculatePercentReceivingBonusPay(
          bonusPayStats,
          refGenderCode,
        );

      calcs.forEach((c) => {
        expect(c.value).toBeNull();
        expect(c.isSuppressed).toBeTruthy();
      });
    });
  });
  describe(`given data in which only the ref gender has more than 10 people earning bonus pay`, () => {
    it(`calculations for all genders are suppressed`, () => {
      // For these mock bonus pay data, assume:
      // - there are 50 males.  all receive 1000 each in bonus pay
      // - there are 9 females.  all of them earned 1500 (each) in bonus pay
      // - there are zero non-binary people.
      // - there are 9 people of unknown gender.  all of them earned 1200 (each) in bonus pay
      const bonusPayStats = new GroupedColumnStats();
      //Male
      for (let i = 0; i < 50; i++) {
        bonusPayStats.push(1000, GENDER_CODES.MALE[0]);
      }
      //Female
      for (let i = 0; i < 9; i++) {
        bonusPayStats.push(1500, GENDER_CODES.FEMALE[0]);
      }
      //Unknown
      for (let i = 0; i < 9; i++) {
        bonusPayStats.push(1200, GENDER_CODES.UNKNOWN[0]);
      }
      bonusPayStats.push(0, GENDER_CODES.UNKNOWN[0]);

      const refGenderCode = GENDER_CODES.MALE[0];

      const calcs: CalculatedAmount[] =
        reportCalcServicePrivate.calculatePercentReceivingBonusPay(
          bonusPayStats,
          refGenderCode,
        );

      calcs.forEach((c) => {
        expect(c.value).toBeNull();
        expect(c.isSuppressed).toBeTruthy();
      });
    });
  });
});

describe('calculateAll', () => {
  describe(`when only one gender category has at least ${reportCalcService.MIN_REQUIRED_PEOPLE_COUNT_PER_GENDER} employees`, () => {
    it(`returns all applicable calculated amounts, but each is suppressed`, async () => {
      const mockRecords = [];
      Array(reportCalcService.MIN_REQUIRED_PEOPLE_FOR_REPORT)
        .fill(null)
        .forEach((v) => {
          mockRecords.push({
            'Gender Code': GENDER_CODES.MALE[0],
            'Hours Worked': '1',
            'Ordinary Pay': '100',
            'Special Salary': '0',
            'Overtime Hours': '0',
            'Overtime Pay': '0',
            'Bonus Pay': '0',
          });
        });
      const allCalculatedAmounts: CalculatedAmount[] =
        await reportCalcService.calculateAll(mockRecords);
      allCalculatedAmounts.forEach((c) => {
        expect(c.isSuppressed).toBeTruthy();
        expect(c.value).toBeNull();
      });
    });
  });
  describe(`given a simulated list of people with gender codes and hourly pay data`, () => {
    it(`all calculations are performed`, async () => {
      // Create a mock pay transparency CSV.
      // For these mock overtime pay data, assume:
      // - All males earn $100/hr for overtime
      // - All females earn $99/hr for overtime
      // - All non-binary people earn $98/hr for overtime
      // - All people whose gender is unknown earn $97/hr for overtime
      // Add 10 fake people in each gender category
      const payAmounts = {};
      payAmounts[GENDER_CODES.MALE[0]] = '100';
      payAmounts[GENDER_CODES.FEMALE[0]] = '99';
      payAmounts[GENDER_CODES.NON_BINARY[0]] = '98';
      payAmounts[GENDER_CODES.UNKNOWN[0]] = '97';

      const mockRecords = [];
      for (const [genderCode, ordinaryPay] of Object.entries(payAmounts)) {
        Array(reportCalcService.MIN_REQUIRED_PEOPLE_COUNT_PER_GENDER)
          .fill(0)
          .forEach((v) => {
            mockRecords.push({
              'Gender Code': genderCode,
              'Hours Worked': '1',
              'Ordinary Pay': ordinaryPay,
              'Special Salary': '0',
              'Overtime Hours': '0',
              'Overtime Pay': '0',
              'Bonus Pay': '0',
            });
          });
      }

      const allCalculatedAmounts: CalculatedAmount[] =
        await reportCalcService.calculateAll(mockRecords);

      // Check that all the required calculations were performed (once each)
      Object.values(CALCULATION_CODES).forEach((calculationCode) => {
        expect(
          allCalculatedAmounts.filter(
            (d) => d.calculationCode == calculationCode,
          ).length,
        ).toBe(1);
      });

      // Confirm the values of some specific calculations
      expect(
        allCalculatedAmounts.filter(
          (d) => d.calculationCode == CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_M,
        )[0].value,
      ).toBe(0);
      expect(
        allCalculatedAmounts.filter(
          (d) => d.calculationCode == CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_W,
        )[0].value,
      ).toBe(1);
      expect(
        allCalculatedAmounts.filter(
          (d) => d.calculationCode == CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_X,
        )[0].value,
      ).toBe(2);
      expect(
        allCalculatedAmounts.filter(
          (d) => d.calculationCode == CALCULATION_CODES.MEAN_HOURLY_PAY_DIFF_U,
        )[0].value,
      ).toBe(3);

      expect(
        allCalculatedAmounts.filter(
          (d) =>
            d.calculationCode == CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_M,
        )[0].value,
      ).toBe(0);
      expect(
        allCalculatedAmounts.filter(
          (d) =>
            d.calculationCode == CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_W,
        )[0].value,
      ).toBe(1);
      expect(
        allCalculatedAmounts.filter(
          (d) =>
            d.calculationCode == CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_X,
        )[0].value,
      ).toBe(2);
      expect(
        allCalculatedAmounts.filter(
          (d) =>
            d.calculationCode == CALCULATION_CODES.MEDIAN_HOURLY_PAY_DIFF_U,
        )[0].value,
      ).toBe(3);
    });
  });
});
