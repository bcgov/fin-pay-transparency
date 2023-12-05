import {
  COL_BONUS_PAY,
  COL_GENDER_CODE,
  COL_HOURS_WORKED,
  COL_OVERTIME_HOURS,
  COL_OVERTIME_PAY,
  COL_ORDINARY_PAY,
  COL_SPECIAL_SALARY,
  LineErrors,
  Row,
  validateService
} from './validate-service';

const NO_DATA_VALUES = ["", "0", "0.0", "0.00"]
const VALID_DOLLAR_AMOUNTS = ["999999999", "1919", "2029.20", "150.4", "", "0", "0.0", "0.00"];
const INVALID_DOLLAR_AMOUNTS = ["N/A", "NA", "$399,929.90", "1373385000.50", "-362566.20", "14b", "a", "$14", "-2", "-1", "1000000000", "1000000000.01"];
const VALID_HOUR_AMOUNTS = ["8760", "75", "100.50", "", "0", "0.0", "0.00"];
const INVALID_HOUR_AMOUNTS = ["1779C", "-1", "8761", "N/A", "NA", "14b", "a", "$14", "-2"];
const VALID_GENDER_CODES = ["M", "F", "W", "X", "U"];
const INVALID_GENDER_CODES = ["H", "N/A", ""]


describe("isZeroSynonym", () => {
  NO_DATA_VALUES.forEach(value => {
    describe(`given a value ('${value}') that should be treated as zero`, () => {
      it("returns true", () => {
        expect(validateService.isZeroSynonym(value)).toBeTruthy();
      })
    })
  });

  const nonZeroValues = ["999999999", "1919", "2029.20", "150.4", "F", "N/A"];
  nonZeroValues.forEach(value => {
    describe(`given a value ('${value}') that should not be treated as zero`, () => {
      it("returns false", () => {
        expect(validateService.isZeroSynonym(value)).toBeFalsy();
      })
    })
  });

})

describe("validateRow", () => {

  describe(`given an row that is fully valid`, () => {
    it("returns null", () => {

      const overrides = {};
      //Valid rows must either have values for both (Hours Worked and )
      //or a value for Special Salary.
      overrides[COL_HOURS_WORKED] = 10;
      overrides[COL_ORDINARY_PAY] = 20;
      const validRow: Row = createSampleRow(overrides);

      const lineNum = 1;
      const lineErrors: LineErrors = validateService.validateRow(lineNum, validRow);
      expect(lineErrors).toBeNull();

    })
  })

  describe(`given a valid row with 0.00 in one of the columns`, () => {
    it("the 0.00 is interpreted the same as 0", () => {

      const overrides = {};
      //Valid rows must either have values for both (Hours Worked and Ordinary Pay)
      //or a value for Special Salary.
      overrides[COL_HOURS_WORKED] = 10;
      overrides[COL_ORDINARY_PAY] = 20;
      overrides[COL_SPECIAL_SALARY] = "0.00";
      const validRow: Row = createSampleRow(overrides);

      const lineNum = 1;
      const lineErrors: LineErrors = validateService.validateRow(lineNum, validRow);
      expect(lineErrors).toBeNull();

    })
  })

  describe(`given an row that specifies both ${COL_HOURS_WORKED} and ${COL_SPECIAL_SALARY}`, () => {
    it("returns a line error", () => {

      const overrides = {};
      overrides[COL_HOURS_WORKED] = VALID_HOUR_AMOUNTS[0];
      overrides[COL_SPECIAL_SALARY] = VALID_DOLLAR_AMOUNTS[0];
      const invalidRow: Row = createSampleRow(overrides);

      const lineNum = 1;
      const lineErrors: LineErrors = validateService.validateRow(lineNum, invalidRow);

      //expect one line error that mentions both COL_HOURS_WORKED and COL_SPECIAL_SALARY
      expect(lineErrors).not.toBeNull();
      expect(lineErrors?.errors?.length).toBe(1);
      expect(doesAnyLineErrorContain(lineErrors, COL_HOURS_WORKED)).toBeTruthy();
      expect(doesAnyLineErrorContain(lineErrors, COL_SPECIAL_SALARY)).toBeTruthy();

    })
  })

  describe(`given an row that specifies no data in any of the following columns: ${COL_HOURS_WORKED}, ${COL_ORDINARY_PAY} and ${COL_SPECIAL_SALARY}`, () => {
    it("returns a line error", () => {

      const overrides = {};
      overrides[COL_HOURS_WORKED] = NO_DATA_VALUES[0];
      overrides[COL_ORDINARY_PAY] = NO_DATA_VALUES[0];
      overrides[COL_SPECIAL_SALARY] = NO_DATA_VALUES[0];
      const invalidRow: Row = createSampleRow(overrides);

      const lineNum = 1;
      const lineErrors: LineErrors = validateService.validateRow(lineNum, invalidRow);

      //expect one line error that mentions COL_HOURS_WORKED, COL_ORDINARY_PAY and COL_SPECIAL_SALARY
      expect(lineErrors).not.toBeNull();
      expect(lineErrors?.errors?.length).toBe(1);
      expect(doesAnyLineErrorContainAll(lineErrors, [COL_HOURS_WORKED, COL_ORDINARY_PAY, COL_SPECIAL_SALARY])).toBeTruthy();

    })
  })

  describe(`given an row with invalid '${COL_GENDER_CODE}'`, () => {
    //Check that validation fails for each of several different 
    //invalid gender codes
    INVALID_GENDER_CODES.forEach(genderCode => {
      describe(`${COL_GENDER_CODE} = ${genderCode}`, () => {
        it("returns a line error", () => {

          // Create a sample row that is valid except for the value of the
          // Gender Code
          const overrides = {};
          overrides[COL_GENDER_CODE] = genderCode;
          const row: Row = createSampleRow(overrides);

          const lineNum = 1;
          const lineErrors: LineErrors = validateService.validateRow(lineNum, row);
          expect(lineErrors).not.toBeNull();
          expect(lineErrors.lineNum).toBe(lineNum);
          expect(doesAnyLineErrorContain(lineErrors, COL_GENDER_CODE)).toBeTruthy();
        });
      })
    })
  })

  describe(`given a row with valid '${COL_GENDER_CODE}'`, () => {
    // Check that validation passes for each given gender code
    VALID_GENDER_CODES.forEach(genderCode => {
      describe(`${COL_GENDER_CODE} = ${genderCode}`, () => {
        it("returns no errors for this column", () => {

          // Create a sample row and uses a specific Gender Code value
          const overrides = {};
          overrides[COL_GENDER_CODE] = genderCode;
          const row: Row = createSampleRow(overrides);

          const lineNum = 1;
          const lineErrors: LineErrors = validateService.validateRow(lineNum, row);
          expect(doesAnyLineErrorContain(lineErrors, COL_GENDER_CODE)).toBeFalsy();

        });
      })
    })
  })

  describe("given an row with invalid '${COL_HOURS_WORKED}'", () => {
    const invalidHoursWorked = INVALID_HOUR_AMOUNTS;

    //Check that validation fails for each of several different 
    //invalid values for COL_HOURS_WORKED
    invalidHoursWorked.forEach(hoursWorked => {
      describe(`${COL_HOURS_WORKED} = ${hoursWorked}`, () => {
        it("returns a line error", () => {


          // Create a sample row that is valid except for the value of the
          // Hours worked
          const overrides = {};
          overrides[COL_HOURS_WORKED] = hoursWorked;
          const row: Row = createSampleRow(overrides);

          const lineNum = 1;
          const lineErrors: LineErrors = validateService.validateRow(lineNum, row);
          expect(lineErrors).not.toBeNull();
          expect(lineErrors.lineNum).toBe(lineNum);
          expect(doesAnyLineErrorContain(lineErrors, COL_HOURS_WORKED)).toBeTruthy();
        });
      })
    })
  })

  describe(`given a row with valid '${COL_HOURS_WORKED}'`, () => {
    const validHoursWorked = VALID_HOUR_AMOUNTS;

    // Check that validation passes for each given value of Hours Worked
    validHoursWorked.forEach(hoursWorked => {
      describe(`${COL_HOURS_WORKED} = ${hoursWorked}`, () => {
        it("returns no errors for this column", () => {

          // Create a sample row and uses a specific Hours Worked value
          const overrides = {};
          overrides[COL_HOURS_WORKED] = hoursWorked;

          //Hours Worked is semi-optional (it, along with Ordinary Pay, are mutually
          //exclusive with Special Salary).  Make sure the related columns have
          //appropriate values for the record to be fully valid.
          if (!validateService.isZeroSynonym(hoursWorked)) {
            overrides[COL_ORDINARY_PAY] = 10;
            overrides[COL_SPECIAL_SALARY] = NO_DATA_VALUES[0];
          }
          else {
            overrides[COL_ORDINARY_PAY] = NO_DATA_VALUES[0];
            overrides[COL_SPECIAL_SALARY] = 100;
          }
          const row: Row = createSampleRow(overrides);

          const lineNum = 1;
          const lineErrors: LineErrors = validateService.validateRow(lineNum, row);

          expect(doesAnyLineErrorContain(lineErrors, COL_HOURS_WORKED)).toBeFalsy();

        });
      })
    })
  })

  describe(`given an row with invalid '${COL_ORDINARY_PAY}'`, () => {
    const invalidOrdinaryPay = INVALID_DOLLAR_AMOUNTS;

    //Check that validation fails for each of several different 
    //invalid values for 'Ordinary Pay'
    invalidOrdinaryPay.forEach(ordinaryPay => {
      describe(`${COL_ORDINARY_PAY} = ${ordinaryPay}`, () => {
        it("returns a line error", () => {

          // Create a sample row that is valid except for the value of the 
          // Ordinary Pay
          const overrides = {};
          overrides[COL_ORDINARY_PAY] = ordinaryPay;
          const row: Row = createSampleRow(overrides);

          const lineNum = 1;
          const lineErrors: LineErrors = validateService.validateRow(lineNum, row);
          expect(lineErrors).not.toBeNull();
          expect(lineErrors.lineNum).toBe(lineNum);
          expect(doesAnyLineErrorContain(lineErrors, COL_ORDINARY_PAY)).toBeTruthy();
        });
      })
    })
  })

  describe(`given a row with valid '${COL_ORDINARY_PAY}'`, () => {
    const validOrdinaryPay = VALID_DOLLAR_AMOUNTS;

    // Check that validation passes for each given value of Ordinary Pay
    validOrdinaryPay.forEach(ordinaryPay => {
      describe(`${COL_ORDINARY_PAY} = '${ordinaryPay}'`, () => {
        it("returns no errors for this column", () => {

          // Create a sample row and uses a specific Ordinary Pay value
          const overrides = {};
          overrides[COL_ORDINARY_PAY] = ordinaryPay;

          //Ordinary Pay is semi-optional (it, along with Hours Worked, are mutually
          //exclusive with Special Salary).  Make sure the related columns have
          //appropriate values for the record to be fully valid.
          if (!validateService.isZeroSynonym(ordinaryPay)) {
            overrides[COL_HOURS_WORKED] = 10;
            overrides[COL_SPECIAL_SALARY] = NO_DATA_VALUES[0];
          }
          else {
            overrides[COL_HOURS_WORKED] = NO_DATA_VALUES[0];
            overrides[COL_SPECIAL_SALARY] = 100;
          }
          const row: Row = createSampleRow(overrides);

          const lineNum = 1;
          const lineErrors: LineErrors = validateService.validateRow(lineNum, row);

          expect(doesAnyLineErrorContain(lineErrors, COL_ORDINARY_PAY)).toBeFalsy();
        });
      })
    })
  })

  describe(`given an row with invalid '${COL_SPECIAL_SALARY}'`, () => {
    const invalidSpecialSalary = INVALID_DOLLAR_AMOUNTS;

    //Check that validation fails for each of several different 
    //invalid values for COL_SPECIAL_SALARY
    invalidSpecialSalary.forEach(specialSalary => {
      describe(`${COL_SPECIAL_SALARY} = ${specialSalary}`, () => {
        it("returns a line error", () => {


          // Create a sample row that is valid except for the value of the 
          // Special Salary
          const overrides = {};
          overrides[COL_SPECIAL_SALARY] = specialSalary;
          const row: Row = createSampleRow(overrides);

          const lineNum = 1;
          const lineErrors: LineErrors = validateService.validateRow(lineNum, row);
          expect(lineErrors).not.toBeNull();
          expect(lineErrors.lineNum).toBe(lineNum);
          expect(doesAnyLineErrorContain(lineErrors, COL_SPECIAL_SALARY)).toBeTruthy();
        })
      })
    })
  })

  describe(`given a row with valid '${COL_SPECIAL_SALARY}'`, () => {
    const validSpecialSalary = VALID_DOLLAR_AMOUNTS;

    // Check that validation passes for each given value of Special Salary
    validSpecialSalary.forEach(specialSalary => {
      describe(`${COL_SPECIAL_SALARY} = '${specialSalary}'`, () => {
        it("returns no errors for this column", () => {

          // Create a sample row and uses a specific Special Salary value
          const overrides = {};
          overrides[COL_SPECIAL_SALARY] = specialSalary;

          //Special Salary is semi-optional (mutually exclusive with Hours Worked and
          //Ordinary Pay).  If a blank value for Special Salary is given, be sure
          //to include non-blank values for the mutually exclusive cols.
          if (validateService.isZeroSynonym(specialSalary)) {
            overrides[COL_HOURS_WORKED] = 10;
            overrides[COL_ORDINARY_PAY] = 20;
          }
          else {
            overrides[COL_HOURS_WORKED] = NO_DATA_VALUES[0];
            overrides[COL_ORDINARY_PAY] = NO_DATA_VALUES[0];
          }
          const row: Row = createSampleRow(overrides);

          const lineNum = 1;
          const lineErrors: LineErrors = validateService.validateRow(lineNum, row);
          expect(doesAnyLineErrorContain(lineErrors, COL_SPECIAL_SALARY)).toBeFalsy();
        });
      })
    })
  })

  describe(`given an row with invalid '${COL_OVERTIME_HOURS}'`, () => {
    const invalidOvertimeHours = INVALID_HOUR_AMOUNTS;

    //Check that validation fails for each of several different 
    //invalid values for COL_OVERTIME_HOURS
    invalidOvertimeHours.forEach(overtimeHours => {
      describe(`${COL_OVERTIME_HOURS} = ${overtimeHours}`, () => {
        it("returns a line error", () => {

          // Create a sample row that is valid except for the value of the 
          // Overtime Hours
          const overrides = {};
          overrides[COL_OVERTIME_HOURS] = overtimeHours;
          const row: Row = createSampleRow(overrides);

          const lineNum = 1;
          const lineErrors: LineErrors = validateService.validateRow(lineNum, row);
          expect(lineErrors).not.toBeNull();
          expect(lineErrors.lineNum).toBe(lineNum);
          expect(doesAnyLineErrorContain(lineErrors, COL_OVERTIME_HOURS)).toBeTruthy();
        })
      })
    })
  })

  describe(`given a row with valid '${COL_OVERTIME_HOURS}'`, () => {
    const validOvertimeHours = VALID_HOUR_AMOUNTS;

    // Check that validation passes for each given value of Overtime Hours
    validOvertimeHours.forEach(overtimeHours => {
      describe(`${COL_OVERTIME_HOURS} = ${overtimeHours}`, () => {
        it("returns no errors for this column", () => {

          // Create a sample row and uses a specific Overtime Hours value
          const overrides = {};
          overrides[COL_OVERTIME_HOURS] = overtimeHours;
          const row: Row = createSampleRow(overrides);

          const lineNum = 1;
          const lineErrors: LineErrors = validateService.validateRow(lineNum, row);
          expect(doesAnyLineErrorContain(lineErrors, COL_OVERTIME_HOURS)).toBeFalsy();

        });
      })
    })
  })

  describe(`given an row with invalid '${COL_OVERTIME_PAY}'`, () => {
    const invalidOvertimePay = INVALID_DOLLAR_AMOUNTS;

    //Check that validation fails for each of several different 
    //invalid values for COL_OVERTIME_PAY
    invalidOvertimePay.forEach(overtimePay => {
      describe(`${COL_OVERTIME_PAY} = ${overtimePay}`, () => {
        it("returns a line error", () => {

          // Create a sample row that is valid except for the value of the 
          // Overtime Pay
          const overrides = {};
          overrides[COL_OVERTIME_PAY] = overtimePay;
          const row: Row = createSampleRow(overrides);

          const lineNum = 1;
          const lineErrors: LineErrors = validateService.validateRow(lineNum, row);
          expect(lineErrors).not.toBeNull();
          expect(lineErrors.lineNum).toBe(lineNum);
          expect(doesAnyLineErrorContain(lineErrors, COL_OVERTIME_PAY)).toBeTruthy();
        })
      })
    })
  })

  describe(`given a row with valid '${COL_OVERTIME_PAY}'`, () => {
    const validOvertimePay = VALID_DOLLAR_AMOUNTS;

    // Check that validation passes for each given value of Overtime Pay
    validOvertimePay.forEach(overtimePay => {
      describe(`${COL_OVERTIME_PAY} = ${overtimePay}`, () => {
        it("returns no errors for this column", () => {

          // Create a sample row and uses a specific Overtime Pay value
          const overrides = {};
          overrides[COL_OVERTIME_PAY] = overtimePay;
          const row: Row = createSampleRow(overrides);

          const lineNum = 1;
          const lineErrors: LineErrors = validateService.validateRow(lineNum, row);
          expect(doesAnyLineErrorContain(lineErrors, COL_OVERTIME_PAY)).toBeFalsy();

        });
      })
    })
  })

  describe(`given an row with invalid '${COL_BONUS_PAY}'`, () => {
    const invalidBonusPay = ["NA", "3,000", "$7,000", "$7000", "-1", "1000000000"]
    invalidBonusPay.forEach(bonusPay => {
      describe(`${COL_BONUS_PAY} = ${bonusPay}`, () => {
        it("returns a line error", () => {

          // Create a sample row that is valid except for the value of the 
          // Bonus Pay
          const overrides = {};
          overrides[COL_BONUS_PAY] = bonusPay;
          const row: Row = createSampleRow(overrides);

          const lineNum = 1;
          const lineErrors: LineErrors = validateService.validateRow(lineNum, row);
          expect(lineErrors).not.toBeNull();
          expect(lineErrors.lineNum).toBe(lineNum);
          expect(doesAnyLineErrorContain(lineErrors, COL_BONUS_PAY)).toBeTruthy();

        })
      })
    })
  })

  describe(`given a row with valid '${COL_BONUS_PAY}'`, () => {
    const validBonusPay = VALID_DOLLAR_AMOUNTS;

    // Check that validation passes for each given value of Overtime Pay
    validBonusPay.forEach(bonusPay => {
      describe(`${COL_BONUS_PAY} = ${bonusPay}`, () => {
        it("returns no errors for this column", () => {


          // Create a sample row and uses a specific Overtime Pay value
          const overrides = {};
          overrides[COL_BONUS_PAY] = bonusPay;
          const row: Row = createSampleRow(overrides);

          const lineNum = 1;
          const lineErrors: LineErrors = validateService.validateRow(lineNum, row);
          expect(doesAnyLineErrorContain(lineErrors, COL_BONUS_PAY)).toBeFalsy();
        });
      })
    })

  })

})

// ----------------------------------------------------------------------------
// Helper functions
// ----------------------------------------------------------------------------

/**
 * Creates a sample Row object populated by default with valid values in all columns.
 * Include a object with key-value pairs to override any of the defaults
 */
const createSampleRow = (override: any = {}): Row => {

  const defaults = {};
  defaults[COL_GENDER_CODE] = 'F';
  defaults[COL_HOURS_WORKED] = "";
  defaults[COL_ORDINARY_PAY] = "";
  defaults[COL_SPECIAL_SALARY] = "";
  defaults[COL_OVERTIME_HOURS] = "5";
  defaults[COL_OVERTIME_PAY] = '100.00';
  defaults[COL_BONUS_PAY] = '';

  const rec = Object.assign({}, defaults, override);
  const raw = `${rec[COL_GENDER_CODE]},${rec[COL_HOURS_WORKED]},${rec[COL_ORDINARY_PAY]},${rec[COL_SPECIAL_SALARY]},${rec[COL_OVERTIME_HOURS]},${rec[COL_OVERTIME_PAY]},${rec[COL_BONUS_PAY]}\r`

  const row: Row = {
    record: rec,
    raw: raw
  }

  return row;
}

/**
 * Scans all error messages in the given LineErrors object, and
 * returns True if at least one of the error messages contains
 * the given text.  Returns false otherwise.
 */
const doesAnyLineErrorContain = (lineErrors: LineErrors, text: string): boolean => {
  return doesAnyLineErrorContainAll(lineErrors, [text]);
}

/**
 * Scans all error messages in the given LineErrors object, and
 * returns True if at least one of the error messages contains
 * all of the given values.  Returns false otherwise
 */
const doesAnyLineErrorContainAll = (lineErrors: LineErrors, values: string[]): boolean => {
  if (!lineErrors) {
    return false;
  }
  for (var lineIndex = 0; lineIndex < lineErrors?.errors?.length; lineIndex++) {
    const errorMsg: string = lineErrors.errors[lineIndex];
    var lineContainsAll = true;
    for (var valueIndex = 0; valueIndex < values.length; valueIndex++) {
      const value = values[valueIndex];
      const lineContainsValue = (errorMsg?.indexOf(value) >= 0);
      lineContainsAll = lineContainsAll && lineContainsValue;
      if (!lineContainsValue) {
        //at least one require value no found on this line, so stop analyzing this line
        break;
      }
    }
    if (lineContainsAll) {
      //the current line contains all the required values.
      return true;
    }
  }
  //all lines have been scanned, and none of them contains all the required
  //values
  return false;
}

