import {
  DateTimeFormatter,
  LocalDate,
  TemporalAdjusters,
  nativeJs,
} from '@js-joda/core';
import { Locale } from '@js-joda/locale_en';
import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { authStore } from '../../store/modules/auth';
import { useCodeStore } from '../../store/modules/codeStore';
import InputForm from '../InputForm.vue';

const DATE_FORMAT = 'yyyy-MM-dd';
const dateFormatter = DateTimeFormatter.ofPattern(DATE_FORMAT);

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
  });

  it('Renders with the expected form controls', () => {
    expect(wrapper.findAll('#companyName').length).toBe(1);
    expect(wrapper.findAll('#companyAddress').length).toBe(1);
    expect(wrapper.findAll('#naicsCode').length).toBe(1);
    expect(wrapper.findAll('#employeeCountRange').length).toBe(1);
    expect(wrapper.findAll('#startDate').length).toBe(1);
    expect(wrapper.findAll('#endDate').length).toBe(1);
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
    const employeeCountRanges = [
      { employee_count_range_id: 1, employee_count_range: '10+' },
    ];
    await codeStore.$patch({ employeeCountRanges: employeeCountRanges } as any);

    const employeeCountRangeComponent = wrapper.findComponent({
      ref: 'employeeCountRange',
    });
    expect(employeeCountRangeComponent.vm.items[0].employee_count_range).toBe(
      employeeCountRanges[0].employee_count_range,
    );
    expect(employeeCountRangeComponent.vm.items.length).toBe(
      employeeCountRanges.length,
    );
  });

  it("Form control for 'NAICS Code' is populated with the expected options", async () => {
    // Mock the naicsCodes property of the codeStore.  InputForm.vue reads
    // this property and uses it to populate the list of options for the NAICS Code
    // form field.
    const codeStore = useCodeStore(pinia);
    const naicsCodes = [
      {
        naics_code: '11',
        naics_label: 'Agriculture, forestry, fishing and hunting',
      },
      {
        naics_code: '913',
        naics_label: 'Local, municipal and regional public administration',
      },
    ];
    await codeStore.$patch({ naicsCodes: naicsCodes } as any);

    const naicsCodeComponent = wrapper.findComponent({ ref: 'naicsCode' });
    expect(naicsCodeComponent.vm.items.length).toBe(naicsCodes.length);
  });

  it('Form controls for company name and address are auto-populated and disabled', async () => {
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

    const companyNameComponent = wrapper.findComponent({ ref: 'companyName' });
    expect(companyNameComponent.vm.value).toBe(userInfo.legalName);
    expect(companyNameComponent.vm.disabled).toBeTruthy();

    const companyAddressComponent = wrapper.findComponent({
      ref: 'companyAddress',
    });
    expect(companyAddressComponent.vm.value).toContain(userInfo.addressLine1);
    expect(companyAddressComponent.vm.value).toContain(userInfo.addressLine2);
    expect(companyAddressComponent.vm.disabled).toBeTruthy();
  });

  it('Setting start date causes end date to default to one year later', async () => {
    const startDateComponent = wrapper.findComponent({ ref: 'startDate' });
    const endDateComponent = wrapper.findComponent({ ref: 'endDate' });

    const startDate = LocalDate.now().minusYears(1).format(dateFormatter);
    const expectedEndDate = LocalDate.now()
      .minusMonths(1)
      .with(TemporalAdjusters.lastDayOfMonth())
      .format(dateFormatter);

    await startDateComponent.setValue(startDate);

    expect(wrapper.vm.$data.startDate).toBe(startDate);
    expect(wrapper.vm.$data.endDate).toBe(expectedEndDate);
  });

  it('Range of allowable start and end months is correct', async () => {
    const dateNow = LocalDate.now();
    const formatter = DateTimeFormatter.ofPattern('YYYY-MM').withLocale(
      Locale.CANADA,
    );
    //Earliest allowable start month is two years before the current month
    expect(
      LocalDate.from(nativeJs(wrapper.vm.minStartDate)).format(formatter),
    ).toBe(dateNow.minusYears(2).withDayOfMonth(1).format(formatter));
    //Latest allowable end month is the month prior the current month
    expect(
      LocalDate.from(nativeJs(wrapper.vm.maxEndDate)).format(formatter),
    ).toBe(
      dateNow
        .minusMonths(1)
        .with(TemporalAdjusters.lastDayOfMonth())
        .format(formatter),
    );

    //Latest allowable start month is 11 months before the latest allowable end month
    expect(
      LocalDate.from(nativeJs(wrapper.vm.maxStartDate)).format(formatter),
    ).toBe(
      LocalDate.from(nativeJs(wrapper.vm.maxEndDate))
        .minusMonths(11)
        .format(formatter),
    );
    //Earliest allowable end month is 11 months after earliest allowable start month
    expect(
      LocalDate.from(nativeJs(wrapper.vm.minEndDate)).format(formatter),
    ).toBe(
      LocalDate.from(nativeJs(wrapper.vm.minStartDate))
        .plusMonths(11)
        .format(formatter),
    );
  });
});
