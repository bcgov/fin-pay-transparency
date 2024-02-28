import { mount } from '@vue/test-utils';
import moment from 'moment';

import { createTestingPinia } from '@pinia/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createVuetify } from "vuetify";
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { authStore } from '../../store/modules/auth';
import { useCodeStore } from '../../store/modules/codeStore';
import InputForm from '../InputForm.vue';

describe("InputForm", () => {
  let wrapper;
  let pinia;

  beforeEach(() => {

    //create an instances of vuetify and pinia so we can inject them 
    //into the mounted component, allowing it to behave as it would
    //in a browser
    const vuetify = createVuetify({
      components,
      directives,
    })

    pinia = createTestingPinia({
      initialState: {
        code: {},
      },
    });

    wrapper = mount(InputForm, {
      global: {
        plugins: [vuetify, pinia],
      }
    })
  })

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  })

  it('Renders with the expected form controls', () => {
    expect(wrapper.findAll("#companyName").length).toBe(1);
    expect(wrapper.findAll("#companyAddress").length).toBe(1);
    expect(wrapper.findAll("#naicsCode").length).toBe(1);
    expect(wrapper.findAll("#employeeCountRange").length).toBe(1);
    expect(wrapper.findAll("#startDate").length).toBe(1);
    expect(wrapper.findAll("#endDate").length).toBe(1);
    expect(wrapper.findAll("#dataConstraints").length).toBe(1);
    expect(wrapper.findAll("#comments").length).toBe(1);
    expect(wrapper.find("#csvFile").attributes("type")).toBe("file");
    expect(wrapper.find("#csvFile").attributes("accept")).toBe(".csv");

  })

  it("Form control for 'employee count ranges' is populated with the expected options", async () => {

    // Mock the employeeCountRanges property of the codeStore.  InputForm.vue reads
    // this property and uses it to populate the list of options for the Employee Count Range
    // form field.
    const codeStore = useCodeStore(pinia)
    const employeeCountRanges = [{ "employee_count_range_id": 1, "employee_count_range": "10+" }];
    await codeStore.$patch({ employeeCountRanges: employeeCountRanges } as any)

    const employeeCountRangeComponent = wrapper.findComponent({ ref: 'employeeCountRange' })
    expect(employeeCountRangeComponent.vm.items[0].employee_count_range).toBe(employeeCountRanges[0].employee_count_range);
    expect(employeeCountRangeComponent.vm.items.length).toBe(employeeCountRanges.length);

  })

  it("Form control for 'NAICS Code' is populated with the expected options", async () => {

    // Mock the naicsCodes property of the codeStore.  InputForm.vue reads
    // this property and uses it to populate the list of options for the NAICS Code
    // form field.
    const codeStore = useCodeStore(pinia)
    const naicsCodes = [
      {
        "naics_code": "11",
        "naics_label": "Agriculture, forestry, fishing and hunting"
      },
      {
        "naics_code": "913",
        "naics_label": "Local, municipal and regional public administration"
      }
    ];
    await codeStore.$patch({ naicsCodes: naicsCodes } as any)

    const naicsCodeComponent = wrapper.findComponent({ ref: 'naicsCode' })
    expect(naicsCodeComponent.vm.items.length).toBe(naicsCodes.length);

  })

  it("Form controls for company name and address are auto-populated and disabled", async () => {

    // Mock the userInfo property of the authStore.  InputForm.vue reads
    // this property and uses it to populate the Company Name and Company Address
    //fields.
    const auth = authStore(pinia)
    const userInfo = {
      legalName: "Fake Company",
      addressLine1: "123 main st",
      addressLine2: ""
    };
    await auth.$patch({ userInfo: userInfo } as any)

    const companyNameComponent = wrapper.findComponent({ ref: 'companyName' })
    expect(companyNameComponent.vm.value).toBe(userInfo.legalName);
    expect(companyNameComponent.vm.disabled).toBeTruthy();

    const companyAddressComponent = wrapper.findComponent({ ref: 'companyAddress' })
    expect(companyAddressComponent.vm.value).toContain(userInfo.addressLine1);
    expect(companyAddressComponent.vm.value).toContain(userInfo.addressLine2);
    expect(companyAddressComponent.vm.disabled).toBeTruthy();

  })

  it('Setting start date causes end date to default to one year later', async () => {

    const startDateComponent = wrapper.findComponent({ ref: 'startDate' })
    const endDateComponent = wrapper.findComponent({ ref: 'endDate' })

    const startDate = moment().subtract(1, "years").format("yyyy-MM-DD");
    const expectedEndDate = moment().subtract(1, "months").endOf('month').format("yyyy-MM-DD");
    await startDateComponent.setValue(startDate);

    expect(wrapper.vm.$data.startDate).toBe(startDate)
    expect(wrapper.vm.$data.endDate).toBe(expectedEndDate)

  })

  it('Range of allowable start and end months is correct', async () => {

    //Earliest allowable start month is two years before the current month
    expect(moment(wrapper.vm.minStartDate).format("YYYY-MM")).toBe(moment().subtract(2, "years").startOf("month").format("YYYY-MM"));
    //Latest allowable end month is the month prior the current month
    expect(moment(wrapper.vm.maxEndDate).format("YYYY-MM")).toBe(moment().subtract(1, "month").endOf("month").format("YYYY-MM"));

    //Latest allowable start month is 11 months before the latest allowable end month
    expect(moment(wrapper.vm.maxStartDate).format("YYYY-MM")).toBe(moment(wrapper.vm.maxEndDate).subtract(11, "months").format("YYYY-MM"));
    //Earliest allowable end month is 11 months after earliest allowable start month
    expect(moment(wrapper.vm.minEndDate).format("YYYY-MM")).toBe(moment(wrapper.vm.minStartDate).add(11, "months").format("YYYY-MM"));

  })

})