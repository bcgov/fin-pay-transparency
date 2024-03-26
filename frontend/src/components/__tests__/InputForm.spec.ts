import { DateTimeFormatter, LocalDate, TemporalAdjusters } from '@js-joda/core';
import { Locale } from '@js-joda/locale_en';
import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { authStore } from '../../store/modules/auth';
import { useCodeStore } from '../../store/modules/codeStore';
import InputForm, { ISubmissionError } from '../InputForm.vue';
import { ReportMode } from '../../store/modules/reportStepper';

const DATE_FORMAT = 'yyyy-MM-dd';
const dateFormatter = DateTimeFormatter.ofPattern(DATE_FORMAT);

const mockNaicsCodes = [
  {
    naics_code: '11',
    naics_label: 'Agriculture, forestry, fishing and hunting',
  },
  {
    naics_code: '913',
    naics_label: 'Local, municipal and regional public administration',
  },
];
const mockEmployeeCountRanges = [
  { employee_count_range_id: 1, employee_count_range: '10+' },
];

const mockReport = {
  report_id: '456768',
  user_comment: 'test abc',
  employee_count_range_id: '1',
  naics_code: '913',
  report_start_date: LocalDate.now()
    .minusYears(1)
    .minusMonths(4)
    .withDayOfMonth(1)
    .format(dateFormatter),
  report_end_date: LocalDate.now()
    .minusMonths(4)
    .minusMonths(1)
    .with(TemporalAdjusters.lastDayOfMonth())
    .format(dateFormatter),
  reporting_year: LocalDate.now().year(),
  data_constraints: 'test 123',
  is_unlocked: true,
};

describe('InputForm', () => {
  let wrapper;
  let pinia;

  beforeEach(() => {
    //create an instances of vuetify and pinia so we can inject them
    //into the mounted component, allowing it to behave as it would
    //in a browser
    const vuetify = createVuetify({
      components,
      directives,
    });

    pinia = createTestingPinia({
      initialState: {
        code: {},
      },
    });

    wrapper = mount(InputForm, {
      global: {
        plugins: [vuetify, pinia],
      },
    });
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('submit', () => {
    describe('when no upload file has been selected', () => {
      it('throws an error', async () => {
        await expect(wrapper.vm.submit()).rejects.toThrow();
      });
    });
  });

  describe('onSubmitComplete', () => {
    describe('when an error object is received', () => {
      it('throws an error', async () => {
        const err = {
          bodyErrors: [],
          rowErrors: null,
          generalErrors: ['mock error'],
        } as ISubmissionError;
        await wrapper.vm.onSubmitComplete(err);
        expect(wrapper.vm.submissionErrors).toStrictEqual(err);
        expect(wrapper.vm.alertMessage).toBe(null);
      });
    });
  });

  describe('toISubmissionError', () => {
    describe('when the input param is a string', () => {
      it('returns an ISubmissionError', () => {
        const result = wrapper.vm.toISubmissionError('mock error message');
        expect(wrapper.vm.isISubmissionError(result)).toBeTruthy();
      });
    });
    describe('when the input param is already an ISubmissionError', () => {
      it('returns the original input param', () => {
        const obj = {
          bodyErrors: null,
          rowErrors: null,
          generalErrors: null,
        };
        const result = wrapper.vm.toISubmissionError(obj);
        expect(result).toBe(obj);
      });
    });
    describe('when the input param is an unknown object', () => {
      it('returns an ISubmissionError', () => {
        const obj = {};
        const result = wrapper.vm.toISubmissionError(obj);
        expect(wrapper.vm.isISubmissionError(result)).toBeTruthy();
      });
    });
    describe("when the input param is an object with a 'message' property", () => {
      it('returns an ISubmissionError', () => {
        const obj = {
          message: 'mock error',
        };
        const result = wrapper.vm.toISubmissionError(obj);
        expect(wrapper.vm.isISubmissionError(result)).toBeTruthy();
      });
    });
  });

  it('Renders with the expected form controls', () => {
    expect(wrapper.findAll('#naicsCode').length).toBe(1);
    expect(wrapper.findAll('#startMonth').length).toBe(1);
    expect(wrapper.findAll('#startYear').length).toBe(1);
    expect(wrapper.findAll('#endMonth').length).toBe(1);
    expect(wrapper.findAll('#endYear').length).toBe(1);
    expect(wrapper.findAll('#reportYear').length).toBe(1);
    expect(wrapper.findAll('#dataConstraints').length).toBe(1);
    expect(wrapper.findAll('#comments').length).toBe(1);
    expect(wrapper.find('#csvFile').attributes('type')).toBe('file');
    expect(wrapper.find('#csvFile').attributes('accept')).toBe('.csv');
  });

  it("Form control for 'employee count ranges' is populated with the expected options", async () => {
    // Mock the employeeCountRanges property of the codeStore.  InputForm.vue reads
    // this property and uses it to populate the list of options for the Employee Count Range
    // form field.
    const codeStore = useCodeStore(pinia);
    await codeStore.$patch({
      employeeCountRanges: mockEmployeeCountRanges,
    } as any);

    expect(wrapper.findAll('input[type="radio"]').length).toBe(1);
  });

  it("Form control for 'NAICS Code' is populated with the expected options", async () => {
    // Mock the naicsCodes property of the codeStore.  InputForm.vue reads
    // this property and uses it to populate the list of options for the NAICS Code
    // form field.
    const codeStore = useCodeStore(pinia);
    await codeStore.$patch({ naicsCodes: mockNaicsCodes } as any);

    const naicsCodeComponent = wrapper.findComponent({ ref: 'naicsCode' });
    expect(naicsCodeComponent.vm.items.length).toBe(mockNaicsCodes.length);
  });

  it('Company name and address are shown', async () => {
    // Mock the userInfo property of the authStore.  InputForm.vue reads
    // this property and uses it to populate the Company Name and Company Address
    //fields.
    const auth = authStore(pinia);
    const userInfo = {
      legalName: 'Fake Company',
      addressLine1: '123 main st',
      addressLine2: '',
    };
    await auth.$patch({ userInfo: userInfo } as any);

    const companyNameComponent = wrapper.find('#companyName');
    expect(companyNameComponent.text()).toContain(userInfo.legalName);

    const companyAddressComponent = wrapper.find('#companyAddress');
    expect(companyAddressComponent.text()).toContain(userInfo.addressLine1);
  });

  it('Setting start date causes end date to default to one year later', async () => {
    const startMonthComponent = wrapper.find('#startMonth');
    const startYearComponent = wrapper.find('#startYear');

    const testDate = LocalDate.now()
      .minusYears(1)
      .minusMonths(4)
      .withDayOfMonth(1);
    const expectedStartDate = testDate.format(dateFormatter);
    const expectedEndDate = LocalDate.now()
      .minusMonths(4)
      .minusMonths(1)
      .with(TemporalAdjusters.lastDayOfMonth())
      .format(dateFormatter);

    await startMonthComponent.setValue(testDate.monthValue());
    await startYearComponent.setValue(testDate.year());

    expect(wrapper.vm.startDate).toBe(expectedStartDate);
    expect(wrapper.vm.endDate).toBe(expectedEndDate);
  });

  it('Range of allowable start and end months is correct', async () => {
    const dateNow = LocalDate.now();
    const formatter = DateTimeFormatter.ofPattern('YYYY-MM').withLocale(
      Locale.CANADA,
    );
    //Earliest allowable start month is two years before the current month
    expect((wrapper.vm.minStartDate as LocalDate).format(formatter)).toBe(
      dateNow.minusYears(2).withDayOfMonth(1).format(formatter),
    );
    //Latest allowable end month is the month prior the current month
    expect((wrapper.vm.maxEndDate as LocalDate).format(formatter)).toBe(
      dateNow
        .minusMonths(1)
        .with(TemporalAdjusters.lastDayOfMonth())
        .format(formatter),
    );

    //Latest allowable start month is 11 months before the latest allowable end month
    expect((wrapper.vm.maxStartDate as LocalDate).format(formatter)).toBe(
      (wrapper.vm.maxEndDate as LocalDate).minusMonths(11).format(formatter),
    );
    //Earliest allowable end month is 11 months after earliest allowable start month
    expect((wrapper.vm.minEndDate as LocalDate).format(formatter)).toBe(
      (wrapper.vm.minStartDate as LocalDate).plusMonths(11).format(formatter),
    );
  });
});

describe('InputForm Edit Mode', () => {
  let wrapper;
  let pinia;

  beforeEach(async () => {
    //create an instances of vuetify and pinia so we can inject them
    //into the mounted component, allowing it to behave as it would
    //in a browser
    const vuetify = createVuetify({
      components,
      directives,
    });

    pinia = createTestingPinia({
      initialState: {
        code: {
          naicsCodes: mockNaicsCodes,
          employeeCountRanges: mockEmployeeCountRanges,
        },

        reportStepper: {
          mode: ReportMode.Edit,
          reportData: mockReport,
          reportId: mockReport.report_id,
        },
      },
    });

    wrapper = mount(InputForm, {
      global: {
        plugins: [vuetify, pinia],
      },
    });
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it('Fills the form with the selected report in edit mode.', async () => {
    expect(wrapper.vm.naicsCode).toBe(mockReport.naics_code);
    expect(wrapper.vm.employeeCountRange).toBe(
      mockReport.employee_count_range_id,
    );
    expect(wrapper.vm.startDate).toBe(mockReport.report_start_date);
    expect(wrapper.vm.endDate).toBe(mockReport.report_end_date);
    expect(wrapper.vm.reportYear).toBe(mockReport.reporting_year);
    expect(wrapper.vm.dataConstraints).toBe(mockReport.data_constraints);
    expect(wrapper.vm.comments).toBe(mockReport.user_comment);
  });

  it('disables the Time Period fields', async () => {
    expect(wrapper.find('#startMonth').element.disabled).toBeTruthy();
    expect(wrapper.find('#startYear').element.disabled).toBeTruthy();
    expect(wrapper.find('#endMonth').element.disabled).toBeTruthy();
    expect(wrapper.find('#endYear').element.disabled).toBeTruthy();
    expect(wrapper.find('#reportYear').element.disabled).toBeTruthy();
  });
});
