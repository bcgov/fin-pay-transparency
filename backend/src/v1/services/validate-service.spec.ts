import {
  COL_BONUS_PAY,
  COL_GENDER_CODE,
  COL_HOURS_WORKED,
  COL_OVERTIME_HOURS,
  COL_OVERTIME_PAY,
  COL_REGULAR_SALARY,
  COL_SPECIAL_SALARY,
  LineErrors,
  Row,
  validateService
} from './validate-service';

const VALID_DOLLAR_AMOUNTS = ["999999999", "1919", "2029.20", "150.4", "N/A", "", "0"];
const INVALID_DOLLAR_AMOUNTS = ["NA", "$399,929.90", "1373385000.50", "-362566.20", "14b", "a", "$14", "-2", "-1", "1000000000", "1000000000.01"];
const VALID_HOUR_AMOUNTS = ["9999", "75", "100.50", "N/A", "", "0"];
const INVALID_HOUR_AMOUNTS = ["1779C", "-1", "10000", "NA", "14b", "a", "$14", "-2"];
const VALID_GENDER_CODES = ["M", "F", "X", "U", "W"];
const INVALID_GENDER_CODES = ["H", "N/A", ""]


describe("validateRow", () => {

  describe(`given an row that is fully valid`, () => {
    it("returns null", () => {

      const validRow: Row = createSampleRow();

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
          const row: Row = createSampleRow(overrides);

          const lineNum = 1;
          const lineErrors: LineErrors = validateService.validateRow(lineNum, row);
          expect(doesAnyLineErrorContain(lineErrors, COL_HOURS_WORKED)).toBeFalsy();

        });
      })
    })
  })

  describe(`given an row with invalid '${COL_REGULAR_SALARY}'`, () => {
    const invalidRegularSalary = INVALID_DOLLAR_AMOUNTS;

    //Check that validation fails for each of several different 
    //invalid values for 'Regular Salar'
    invalidRegularSalary.forEach(regularSalary => {
      describe(`${COL_REGULAR_SALARY} = ${regularSalary}`, () => {
        it("returns a line error", () => {

          // Create a sample row that is valid except for the value of the 
          // Regular Salary
          const overrides = {};
          overrides[COL_REGULAR_SALARY] = regularSalary;
          const row: Row = createSampleRow(overrides);

          const lineNum = 1;
          const lineErrors: LineErrors = validateService.validateRow(lineNum, row);
          expect(lineErrors).not.toBeNull();
          expect(lineErrors.lineNum).toBe(lineNum);
          expect(doesAnyLineErrorContain(lineErrors, COL_REGULAR_SALARY)).toBeTruthy();
        });
      })
    })
  })

  describe(`given a row with valid '${COL_REGULAR_SALARY}'`, () => {
    const validRegularSalary = VALID_DOLLAR_AMOUNTS;

    // Check that validation passes for each given value of Regular Salary
    validRegularSalary.forEach(regularSalary => {
      describe(`${COL_REGULAR_SALARY} = ${regularSalary}`, () => {
        it("returns no errors for this column", () => {

          // Create a sample row and uses a specific Regular Salary value
          const overrides = {};
          overrides[COL_REGULAR_SALARY] = regularSalary;
          const row: Row = createSampleRow(overrides);

          const lineNum = 1;
          const lineErrors: LineErrors = validateService.validateRow(lineNum, row);
          expect(doesAnyLineErrorContain(lineErrors, COL_REGULAR_SALARY)).toBeFalsy();

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
      describe(`${COL_SPECIAL_SALARY} = ${specialSalary}`, () => {
        it("returns no errors for this column", () => {

          // Create a sample row and uses a specific Special Salary value
          const overrides = {};
          overrides[COL_SPECIAL_SALARY] = specialSalary;
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
  defaults[COL_REGULAR_SALARY] = "";
  defaults[COL_SPECIAL_SALARY] = "";
  defaults[COL_OVERTIME_HOURS] = "5";
  defaults[COL_OVERTIME_PAY] = '100.00';
  defaults[COL_BONUS_PAY] = '';

  const rec = Object.assign({}, defaults, override);
  const raw = `${rec[COL_GENDER_CODE]},${rec[COL_HOURS_WORKED]},${rec[COL_REGULAR_SALARY]},${rec[COL_SPECIAL_SALARY]},${rec[COL_OVERTIME_HOURS]},${rec[COL_OVERTIME_PAY]},${rec[COL_BONUS_PAY]}\r`

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
  if (!lineErrors) {
    return false;
  }
  for (var i = 0; i < lineErrors?.errors?.length; i++) {
    const errorMsg: string = lineErrors.errors[i];
    if (errorMsg?.indexOf(text) >= 0) {
      return true;
    }
  }
  return false;
}