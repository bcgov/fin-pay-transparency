import { generateReport } from './doc-gen-service';

const reportData = {
  chartData: {
    meanHourlyPayGap: [],
    medianHourlyPayGap: [],
    meanOvertimePayGap: [],
    medianOvertimePayGap: [],
    meanBonusPayGap: [],
    medianBonusPayGap: [],
    hourlyPayQuartile1: [],
    hourlyPayQuartile2: [],
    hourlyPayQuartile3: [],
    hourlyPayQuartile4: [],
    percentReceivingOvertimePay: [],
    percentReceivingBonusPay: [],
    hourlyPayQuartilesLegend: [
      {
        code: 'M',
        label: 'Men',
        extendedLabel: 'Men',
        color: '#1c3664',
      },
    ],
  },
  chartSuppressedError: 'Suppressed error',
  reportType: 'html',
  companyName: 'Test company',
  companyAddress: 'Test company address',
  reportStartDate: 'Feb 1, 2024',
  reportEndDate: 'Feb 1, 2024',
  naicsCode: '1234',
  naicsLabel: 'Test label',
  employeeCountRange: '0 - 500',
  comments: 'Small company',
  referenceGenderCategory: 'Test category',
  explanatoryNotes: {
    dataConstraints: {
      num: 1000,
      text: 'dataConstraints test',
    },
    meanHourlyPayDiff: {
      num: 1000,
    },
    medianHourlyPayDiff: {
      num: 1000,
    },
    meanOvertimePayDiff: {
      num: 1000,
    },
    medianOvertimePayDiff: {
      num: 1000,
    },
    meanOvertimeHoursDiff: { num: 1000 },
    medianOvertimeHoursDiff: { num: 1000 },
    meanBonusPayDiff: { num: 1000 },
    medianBonusPayDiff: { num: 1000 },
    payQuartiles: { num: 1000 },
  },
  tableData: {
    meanHourlyPayDiff: {
      num: 1000,
    },
    medianHourlyPayDiff: {
      num: 1000,
    },
    meanOvertimePayDiff: {
      num: 1000,
    },
    medianOvertimePayDiff: {
      num: 1000,
    },
    meanOvertimeHoursDiff: {
      num: 1000,
    },
    meanOvertimeHoursGap: [],
    medianOvertimeHoursGap: [],
  },
  chartSummaryText: {
    meanHourlyPayGap: 'meanHourlyPayGap text',
  },
};

describe.only('doc-get-service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate a report', async () => {
    const report = await generateReport('html', reportData as any);
    expect(report).toBeDefined();
  });
});
