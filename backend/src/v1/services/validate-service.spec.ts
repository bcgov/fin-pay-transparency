import { validateService } from './validate-service';

describe("validateRow", () => {

  describe("given an row with invalid 'Gender Code'", () => {
    it("returns a line error", () => {
      const row = {
        record: {
          'Gender Code': 'H',
          'Hours Worked': '1992',
          'Regular Salary': '78072.00',
          'Special Salary': '',
          'Overtime Hours': '12',
          'Overtime Pay': '705.47',
          'Bonus Pay': '',
          'Regular Hourly Wage': '39.19'
        },
        raw: 'H,1992,78072.00,,12,705.47,,39.19\r'
      }
      const lineNum = 1;
      const result = validateService.validateRow(lineNum, row);
      expect(result).not.toBeNull();
      expect(result.lineNum).toBe(lineNum);
      expect(result.errors.length).toEqual(1);
      expect(result.errors[0]).toContain("Gender Code");
    })
  })

  describe("given an row with invalid 'Hours Worked'", () => {
    it("returns a line error", () => {
      const row = {
        record: {
          'Gender Code': 'M',
          'Hours Worked': '1779C',
          'Regular Salary': '119772.00',
          'Special Salary': '',
          'Overtime Hours': '72.00',
          'Overtime Pay': '11512.21',
          'Bonus Pay': '',
          'Regular Hourly Wage': ''
        },
        raw: 'M,1779C,119772.00,,72.00,11512.21,,\r'
      }
      const lineNum = 1;
      const result = validateService.validateRow(lineNum, row);
      expect(result).not.toBeNull();
      expect(result.lineNum).toBe(lineNum);
      expect(result.errors.length).toEqual(1);
      expect(result.errors[0]).toContain("Hours Worked");
    })
  })

  describe("given an row with invalid 'Regular Salary'", () => {
    it("returns a line error", () => {
      const row = {
        record: {
          'Gender Code': 'F',
          'Hours Worked': '2052',
          'Regular Salary': '-362566.20',
          'Special Salary': '',
          'Overtime Hours': '54',
          'Overtime Pay': '14311.82368',
          'Bonus Pay': '600.00',
          'Regular Hourly Wage': '176.69'
        },
        raw: 'F,2052,-362566.20,,54,14311.82368,600.00,176.69\r'
      }
      const lineNum = 1;
      const result = validateService.validateRow(lineNum, row);
      expect(result).not.toBeNull();
      expect(result.lineNum).toBe(lineNum);
      expect(result.errors.length).toEqual(1);
      expect(result.errors[0]).toContain("Regular Salary");
    })
  })

  describe("given an row with invalid 'Overtime Hours'", () => {
    it("returns a line error", () => {
      const row = {
        record: {
          'Gender Code': 'F',
          'Hours Worked': '2085',
          'Regular Salary': '45176.80',
          'Special Salary': '',
          'Overtime Hours': 'NA',
          'Overtime Pay': '0.00',
          'Bonus Pay': '',
          'Regular Hourly Wage': '21.67'
        },
        raw: 'F,2085,45176.80,,0,0.00,,21.67\r'
      }
      const lineNum = 1;
      const result = validateService.validateRow(lineNum, row);
      expect(result).not.toBeNull();
      expect(result.lineNum).toBe(lineNum);
      expect(result.errors.length).toEqual(1);
      expect(result.errors[0]).toContain("Overtime Hours");
    })
  })

})