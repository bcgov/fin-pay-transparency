import { DateTimeFormatter, LocalDate, TemporalAdjusters } from '@js-joda/core';
import { Locale } from '@js-joda/locale_en';
import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { authStore } from '../../store/modules/auth';
import { useCodeStore } from '../../store/modules/codeStore';
import { ReportMode } from '../../store/modules/reportStepper';
import InputForm, { ISubmissionError } from '../InputForm.vue';
import { CsvService, ParseStatus } from '../../common/csvService';
import ApiService from '../../common/apiService';
import { NotificationService } from '../../common/notificationService';
import { useConfigStore } from '../../store/modules/config';

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
  user_comment: '<p>test abc</p>',
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
  data_constraints: '<p>test 123</p>',
  is_unlocked: true,
};

const mockConfig = {
  maxUploadFileSize: 8388608, //bytes
  reportEditDurationInDays: 30,
  reportingYearOptions: [LocalDate.now().year() - 1, LocalDate.now().year()],
};

const openSpy = vi.fn(async () => true);
vi.mock('../util/ConfirmationDialog.vue', () => ({
  default: {
    name: 'ConfirmationDialog',
    setup(_, { expose }) {
      expose({ open: openSpy });
    },
    template: `
      <div data-testid="confirmation-dialog">
        <slot name="message" />
      </div>
    `,
  },
}));

describe('InputForm', () => {
  let wrapper;
  let pinia;
  const errors: Error[] = [];

  const initWrapper = async (options: any = {}) => {
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
        config: { config: mockConfig },
      },
      stubActions: false,
    });

    const mockRouter = {
      push: vi.fn(),
    };

    wrapper = mount(InputForm, {
      global: {
        plugins: [vuetify, pinia],
        mocks: { $router: mockRouter },
        config: {
          // Vue does not propagate thrown errors from methods DOM elements after activation.
          // This captures them so we can assert against them in tests.
          errorHandler(err: unknown) {
            errors.push(err instanceof Error ? err : new Error(String(err)));
          },
        },
      },
    });
    await flushPromises();
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    await initWrapper();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    sessionStorage.removeItem('backupFormDraft');
  });

  describe('submit', () => {
    let mockParse;
    let mockPostSubmission;
    beforeEach(async () => {
      // Form fields come from pinia store. Set them up for each test.
      const codeStore = useCodeStore(pinia);
      await codeStore.$patch({
        employeeCountRanges: mockEmployeeCountRanges,
      } as never);
      await codeStore.$patch({ naicsCodes: mockNaicsCodes } as never);

      // company name and address are automatically obtained. Set them up for each test.
      const auth = authStore(pinia);
      const userInfo = {
        legalName: 'Fake Company',
        addressLine1: '123 main st',
        addressLine2: '',
      };
      await auth.$patch({ userInfo: userInfo } as never);

      // Setup mocks that are used by all submit tests
      mockParse = vi.spyOn(CsvService, 'parse').mockResolvedValue({
        status: ParseStatus.Success,
        data: [{ foo: 'bar' }],
      });

      mockPostSubmission = vi
        .spyOn(ApiService, 'postSubmission')
        .mockResolvedValue({
          report_id: 10,
          message: 'ok',
        });
    });

    // Helper to populate all form fields with optional overrides
    const populateAllFields = async (
      overrides: { [key: string]: any } = {},
    ) => {
      const defaults = {
        naicsCode: '11',
        employeeCountRange: 1,
        confirmReportingYear: true,
        uploadFile: new File(['colA,colB\n1,2'], 'test.csv', {
          type: 'text/csv',
        }),
      };
      const config = { ...defaults, ...overrides };

      if (config.naicsCode !== null) {
        const naicsCodeComponent = wrapper.findComponent({ ref: 'naicsCode' });
        await naicsCodeComponent.setValue(config.naicsCode);
      }

      if (config.employeeCountRange !== null) {
        const employeeCountRangeComponent = wrapper.findComponent({
          ref: 'employeeCountRange',
        });
        await employeeCountRangeComponent.setValue(config.employeeCountRange);
      }

      if (config.confirmReportingYear !== null) {
        const confirmReportingYearComponent = wrapper.findComponent({
          ref: 'confirmReportingYear',
        });
        await confirmReportingYearComponent.setValue(
          config.confirmReportingYear,
        );
      }

      if (config.uploadFile !== null) {
        const fileInput = wrapper.findComponent({ ref: 'uploadFile' });
        await fileInput.setValue(config.uploadFile);
      }
    };

    it('submits the form when all fields are valid and a file is selected', async () => {
      // populate fields
      await populateAllFields();

      // submit
      await wrapper.find('#submitButton').trigger('submit');
      await flushPromises();

      // assertions

      // CSV parsed
      expect(mockParse).toHaveBeenCalledWith(expect.any(File));

      // ApiService called with full submission
      expect(mockPostSubmission).toHaveBeenCalledTimes(1);
      const submission = mockPostSubmission.mock.calls[0]?.[0];

      expect(submission).toMatchObject({
        companyName: 'Fake Company',
        companyAddress: '123 main st',
        naicsCode: '11',
        employeeCountRangeId: 1,
        reportingYear: new Date().getFullYear(),
        dataConstraints: null,
        comments: null,
        rows: [{ foo: 'bar' }],
      });

      expect(wrapper.text()).not.toContain(
        'Please check the form and correct all errors before submitting.',
      );
    });

    it('shows error when naicsCode not selected', async () => {
      // populate fields (skip naicsCode)
      await populateAllFields({ naicsCode: null });

      // submit
      await wrapper.find('#submitButton').trigger('submit');
      await flushPromises();

      // assertions
      expect(errors[0]).toBeInstanceOf(Error);
      expect(errors[0]?.message).toBe('Form missing required fields');
      const naicsCodeComponent = wrapper.findComponent({ ref: 'naicsCode' });
      expect(naicsCodeComponent.text()).toContain('Complete this field.');
      expect(wrapper.text()).toContain(
        'Please check the form and correct all errors before submitting.',
      );
    });

    it('shows error when employeeCountRange not selected', async () => {
      // populate fields (skip employeeCountRange)
      await populateAllFields({ employeeCountRange: null });

      // submit
      await wrapper.find('#submitButton').trigger('submit');
      await flushPromises();

      // assertions
      expect(errors[0]).toBeInstanceOf(Error);
      expect(errors[0]?.message).toBe('Form missing required fields');
      const employeeCountRangeComponent = wrapper.findComponent({
        ref: 'employeeCountRange',
      });
      expect(employeeCountRangeComponent.text()).toContain(
        'Complete this field.',
      );
      expect(wrapper.text()).toContain(
        'Please check the form and correct all errors before submitting.',
      );
    });

    it('shows error when confirmReportingYear not selected', async () => {
      // populate fields (skip confirmReportingYear)
      await populateAllFields({ confirmReportingYear: false });

      // submit
      await wrapper.find('#submitButton').trigger('submit');
      await flushPromises();

      // assertions
      expect(errors[0]).toBeInstanceOf(Error);
      expect(errors[0]?.message).toBe('Form missing required fields');
      const confirmReportingYearComponent = wrapper.findComponent({
        ref: 'confirmReportingYear',
      });
      expect(confirmReportingYearComponent.text()).toContain(
        'Complete this field.',
      );
      expect(wrapper.text()).toContain(
        'Please check the form and correct all errors before submitting.',
      );
    });

    it('shows error when uploadFile not selected', async () => {
      // populate fields (skip uploadFile)
      await populateAllFields({ uploadFile: null });

      // submit
      await wrapper.find('#submitButton').trigger('submit');
      await flushPromises();

      // assertions
      expect(errors[0]).toBeInstanceOf(Error);
      expect(errors[0]?.message).toBe('Form missing required fields');
      expect(wrapper.text()).toContain(
        'Please check the form and correct all errors before submitting.',
      );
    });

    it('saves a backup draft when submission fails', async () => {
      mockPostSubmission.mockRejectedValueOnce(new Error('Submission failed'));
      // submit
      await populateAllFields();
      await wrapper.find('#submitButton').trigger('submit');
      await flushPromises();

      const saved = JSON.parse(sessionStorage.getItem('backupFormDraft') ?? '');
      expect(mockPostSubmission).toHaveBeenCalledTimes(1);
      expect(saved).toMatchObject({
        naics_code: '11',
        employee_count_range_id: 1,
        reporting_year: new Date().getFullYear(),
        data_constraints: null,
        user_comment: null,
      });
      expect(saved).toHaveProperty('report_start_date');
      expect(saved).toHaveProperty('report_end_date');
    });
  });

  describe('mounted', () => {
    it('loads a saved draft from session storage', async () => {
      const draft = {
        naics_code: '11',
        employee_count_range_id: 1,
        report_start_date: '2022-01-01',
        report_end_date: '2022-12-31',
        reporting_year: 2022,
        data_constraints: '<p>test constraints</p>',
        user_comment: '<p>test comment</p>',
      };

      sessionStorage.setItem('backupFormDraft', JSON.stringify(draft));
      await initWrapper();

      expect(wrapper.vm.naicsCode).toBe(draft.naics_code);
      expect(wrapper.vm.employeeCountRange).toBe(draft.employee_count_range_id);
      expect(wrapper.vm.startYear).toBe(2022);
      expect(wrapper.vm.startMonth).toBe(1);
      expect(wrapper.vm.endYear).toBe(2022);
      expect(wrapper.vm.endMonth).toBe(12);
      expect(wrapper.vm.reportYear).toBe(draft.reporting_year);
      expect(wrapper.vm.dataConstraints).toBe(draft.data_constraints);
      expect(wrapper.vm.comments).toBe(draft.user_comment);
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
    expect(wrapper.findAll('#confirmReportingYear').length).toBe(1);
    expect(wrapper.findAll('#dataConstraints').length).toBe(1);
    expect(wrapper.findAll('#employerStatement').length).toBe(1);
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
    const startMonthComponent = wrapper.findComponent({ ref: 'startMonth' });
    const startYearComponent = wrapper.findComponent({ ref: 'startYear' });

    const testStartDate = wrapper.vm.minStartDate as LocalDate;
    const expectedStartDate = testStartDate.format(dateFormatter);
    const expectedEndDate = testStartDate
      .plusMonths(11)
      .with(TemporalAdjusters.lastDayOfMonth())
      .format(dateFormatter);

    await startMonthComponent.setValue(testStartDate.monthValue());
    await startYearComponent.setValue(testStartDate.year());

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
      dateNow
        .with(TemporalAdjusters.firstDayOfYear())
        .minusYears(1)
        .withDayOfMonth(1)
        .format(formatter),
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

  it('Range of allowable start and end dates is adjusted based on reporting year', async () => {
    const reportYearComponent = wrapper.findComponent({ ref: 'reportYear' });
    const reportYearOptions: number[] = [
      LocalDate.now().minusYears(1).year(),
      LocalDate.now().year(),
    ];
    for (const reportYear of reportYearOptions) {
      reportYearComponent.setValue(reportYear);
      await nextTick();
      expect(wrapper.vm.minStartDate as LocalDate).toStrictEqual(
        LocalDate.of(reportYear - 1, 1, 1),
      );
      //maxEndDate should always be in the past
      expect(
        (wrapper.vm.maxEndDate as LocalDate).isBefore(LocalDate.now()),
      ).toBeTruthy();
      //maxEndDate should never be after the last day of the reporting year
      const endOfReportingYear = LocalDate.of(reportYear, 12, 31);
      expect(
        (wrapper.vm.maxEndDate as LocalDate).isAfter(endOfReportingYear),
      ).toBeFalsy();
    }
  });

  // ===========================================================================
  // beforeRouteLeave
  // ===========================================================================

  describe('beforeRouteLeave', () => {
    it('calls next() immediately without opening the confirmation dialog', async () => {
      const next = vi.fn();

      await (InputForm as any).beforeRouteLeave.call(
        wrapper.vm,
        { fullPath: '/some-other-route' },
        {},
        next,
      );

      expect(next).toHaveBeenCalledWith();
      expect(openSpy).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // uploadFileSize computed property
  // ===========================================================================

  describe('uploadFileSize', () => {
    it('returns an empty string when no file is selected', async () => {
      wrapper.vm.uploadFileValue = undefined;
      expect(wrapper.vm.uploadFileSize).toBe('');
    });

    it('returns a human-readable size string when a file is selected', async () => {
      // Create a mock File with a known byte size (1024 bytes = 1 KiB)
      const mockFile = new File(['x'.repeat(1024)], 'test.csv', {
        type: 'text/csv',
      });
      wrapper.vm.uploadFileValue = mockFile;
      const size = wrapper.vm.uploadFileSize;
      // The value should be a non-empty string produced by humanFileSize()
      expect(typeof size).toBe('string');
      expect(size.length).toBeGreaterThan(0);
    });

    it('reflects the correct size after the file changes', async () => {
      const small = new File(['abc'], 'small.csv', { type: 'text/csv' });
      const large = new File(['x'.repeat(1024 * 1024)], 'large.csv', {
        type: 'text/csv',
      });

      wrapper.vm.uploadFileValue = small;
      const smallSize = wrapper.vm.uploadFileSize;

      wrapper.vm.uploadFileValue = large;
      const largeSize = wrapper.vm.uploadFileSize;

      // Sizes should differ – larger file → larger formatted string value
      expect(largeSize).not.toBe(smallSize);
    });
  });

  // ===========================================================================
  // mounted – loadConfig error handling
  // ===========================================================================

  describe('mounted loadConfig error handling', () => {
    it('pushes an error notification when loadConfig rejects', async () => {
      const pushNotificationError = vi
        .spyOn(NotificationService, 'pushNotificationError')
        .mockImplementation(() => {});

      // Mount with a pinia that lets us override loadConfig action
      const vuetify = createVuetify({ components, directives });
      const pinia = createTestingPinia({
        initialState: { code: {}, config: { config: mockConfig } },
        stubActions: false,
      });

      // Patch loadConfig on the config store to return a rejecting promise
      const configStore = useConfigStore(pinia);
      vi.spyOn(configStore, 'loadConfig').mockReturnValue(
        Promise.reject(new Error('network error')) as any,
      );

      const wrapper = mount(InputForm, {
        global: { plugins: [vuetify, pinia] },
      });
      await flushPromises();

      expect(pushNotificationError).toHaveBeenCalledWith(
        'Failed to load application settings. Please reload the page.',
      );

      wrapper.unmount();
    });

    it('does NOT push a notification when loadConfig resolves successfully', async () => {
      const pushNotificationError = vi
        .spyOn(NotificationService, 'pushNotificationError')
        .mockImplementation(() => {});

      const vuetify = createVuetify({ components, directives });
      const pinia = createTestingPinia({
        initialState: { code: {}, config: { config: mockConfig } },
        stubActions: false,
      });

      const configStore = useConfigStore(pinia);
      vi.spyOn(configStore, 'loadConfig').mockReturnValue(
        Promise.resolve(mockConfig) as any,
      );

      const wrapper = mount(InputForm, {
        global: { plugins: [vuetify, pinia] },
      });
      await flushPromises();

      expect(pushNotificationError).not.toHaveBeenCalled();

      wrapper.unmount();
    });
  });

  // ===========================================================================
  // onSubmitComplete
  // ===========================================================================

  describe('onSubmitComplete', () => {
    describe('when called with a non-null ISubmissionError', () => {
      it('sets submissionErrors and clears alertMessage', async () => {
        const err: ISubmissionError = {
          bodyErrors: ['bad column'],
          rowErrors: null,
          generalErrors: ['Something went wrong.'],
        };

        await wrapper.vm.onSubmitComplete(err);

        expect(wrapper.vm.submissionErrors).toStrictEqual(err);
        expect(wrapper.vm.alertMessage).toBeNull();
      });

      it('sets isProcessing to false', async () => {
        wrapper.vm.isProcessing = true;
        const err: ISubmissionError = {
          bodyErrors: null,
          rowErrors: null,
          generalErrors: ['err'],
        };

        await wrapper.vm.onSubmitComplete(err);

        expect(wrapper.vm.isProcessing).toBe(false);
      });

      it('does NOT navigate to the next stage', async () => {
        const err: ISubmissionError = {
          bodyErrors: null,
          rowErrors: null,
          generalErrors: ['err'],
        };

        await wrapper.vm.onSubmitComplete(err);

        expect(wrapper.vm.$router.push).not.toHaveBeenCalled();
      });
    });

    describe('when called with null (no errors)', () => {
      it('sets the success alert message', async () => {
        await wrapper.vm.onSubmitComplete(null);

        expect(wrapper.vm.alertMessage).toBe('Submission received.');
      });

      it('clears submissionErrors', async () => {
        wrapper.vm.submissionErrors = {
          bodyErrors: null,
          rowErrors: null,
          generalErrors: ['stale error'],
        };

        await wrapper.vm.onSubmitComplete(null);

        expect(wrapper.vm.submissionErrors).toBeNull();
      });

      it('sets isProcessing to false', async () => {
        wrapper.vm.isProcessing = true;

        await wrapper.vm.onSubmitComplete(null);

        expect(wrapper.vm.isProcessing).toBe(false);
      });

      it('navigates to /draft-report', async () => {
        await wrapper.vm.onSubmitComplete(null);

        expect(wrapper.vm.$router.push).toHaveBeenCalledWith({
          path: '/draft-report',
        });
      });
    });
  });
});

describe('InputForm Edit Mode', () => {
  let wrapper;
  let pinia;

  beforeEach(async () => {
    vi.resetAllMocks();
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

        config: { config: mockConfig },
      },
    });

    wrapper = mount(InputForm, {
      global: {
        plugins: [vuetify, pinia],
      },
    });
    await flushPromises();
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
    expect(wrapper.vm.confirmReportingYear).toBeTruthy();
    expect(wrapper.vm.dataConstraints).toBe(mockReport.data_constraints);
    expect(wrapper.vm.comments).toBe(mockReport.user_comment);
  });

  it('disables the Reporting Year field', async () => {
    expect(wrapper.find('#reportYear').element.disabled).toBeTruthy();
    expect(wrapper.find('#confirmReportingYear').element.disabled).toBeTruthy();
  });

  // ===========================================================================
  // beforeRouteLeave - edit mode
  // ===========================================================================

  describe('beforeRouteLeave - edit mode', () => {
    it('calls next() immediately without opening the confirmation dialog when destination is the approvedRoute', async () => {
      wrapper.vm.approvedRoute = '/draft-report';
      const next = vi.fn();

      await (InputForm as any).beforeRouteLeave.call(
        wrapper.vm,
        { fullPath: '/draft-report' },
        {},
        next,
      );

      expect(next).toHaveBeenCalledWith();
      expect(openSpy).not.toHaveBeenCalled();
    });

    it('opens the confirmation dialog and passes its response to next() when destination is NOT the approvedRoute', async () => {
      wrapper.vm.approvedRoute = '/draft-report';
      const next = vi.fn();
      openSpy.mockResolvedValueOnce(true);

      await (InputForm as any).beforeRouteLeave.call(
        wrapper.vm,
        { fullPath: '/' },
        {},
        next,
      );

      expect(openSpy).toHaveBeenCalledWith('Please Confirm');
      expect(next).toHaveBeenCalledWith(true);
    });

    it('passes false to next() when the user dismisses the dialog', async () => {
      wrapper.vm.approvedRoute = '/draft-report';
      const next = vi.fn();
      openSpy.mockResolvedValueOnce(false);

      await (InputForm as any).beforeRouteLeave.call(
        wrapper.vm,
        { fullPath: '/' },
        {},
        next,
      );

      expect(next).toHaveBeenCalledWith(false);
    });
  });
});
