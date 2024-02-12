import {
  REPORT_FORMAT,
  ReportData,
  docGenServicePrivate,
  generateReport,
} from './doc-gen-service';

const reportData: ReportData = {
  companyName: 'Test company',
  companyAddress: 'Test',
  reportStartDate: 'January 1, 2023',
  reportEndDate: 'January 31, 2024',
  naicsCode: '11',
  naicsLabel: 'Agriculture, forestry, fishing and hunting',
  employeeCountRange: '50-299',
  comments: '',
  referenceGenderCategory: 'Men',
  chartSuppressedError: '',
  tableData: {
    meanOvertimeHoursGap: [],
    medianOvertimeHoursGap: [],
  },
  chartData: {
    meanHourlyPayGap: [],
    medianHourlyPayGap: [],
    meanOvertimePayGap: [],
    medianOvertimePayGap: [],
    percentReceivingOvertimePay: [],
    meanBonusPayGap: [],
    medianBonusPayGap: [],
    percentReceivingBonusPay: [],
    hourlyPayQuartile1: [],
    hourlyPayQuartile2: [],
    hourlyPayQuartile3: [],
    hourlyPayQuartile4: [],
    hourlyPayQuartilesLegend: [],
  },
  chartSummaryText: {
    meanHourlyPayGap: '',
    medianHourlyPayGap: '',
    meanOvertimePayGap: '',
    medianOvertimePayGap: '',
    meanBonusPayGap: null,
    medianBonusPayGap: null,
    meanOvertimeHoursGap: '',
    medianOvertimeHoursGap: '',
    hourlyPayQuartiles: '',
  },
  explanatoryNotes: {
    meanHourlyPayDiff: { num: 1 },
    medianHourlyPayDiff: { num: 2 },
    meanOvertimePayDiff: { num: 3 },
    medianOvertimePayDiff: { num: 4 },
    meanOvertimeHoursDiff: { num: 5 },
    medianOvertimeHoursDiff: { num: 6 },
    meanBonusPayDiff: { num: 7 },
    medianBonusPayDiff: { num: 8 },
    payQuartiles: { num: 9 },
  },
  isAllCalculatedDataSuppressed: false,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('generateReport', () => {
  it('should generate a report', async () => {
    const report = await generateReport(REPORT_FORMAT.HTML, reportData as any);
    expect(report).toBeDefined();
  });
});

describe('buildEjsTemplate', () => {
  describe('when the report data indicate that all calculations have been suppressed', () => {
    it('returns a template with a simplified report', async () => {
      const reportDataAllCalcsSuppressed = {
        ...reportData,
        isAllCalculatedDataSuppressed: true,
      };
      const template = await docGenServicePrivate.buildEjsTemplate(
        reportDataAllCalcsSuppressed,
      );
      expect(template).toContain('block-insufficient-data');
      expect(template).not.toContain('block-hourly-pay');
    });
  });
  describe("when the report data indicate that some calculations weren't suppressed", () => {
    it('returns a template that includes all the chart content blocks', async () => {
      const template = await docGenServicePrivate.buildEjsTemplate(reportData);
      expect(template).toContain('block-hourly-pay');
      expect(template).toContain('block-overtime');
      expect(template).toContain('block-bonus-pay');
      expect(template).toContain('block-hourly-pay-quartiles');
      expect(template).not.toContain('block-insufficient-data');
    });
  });
});
