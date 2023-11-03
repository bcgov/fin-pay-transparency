import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from "vuetify";
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import InputForm from '../InputForm.vue'
import moment from 'moment';

describe("InputForm", () => {
  let wrapper = null;

  beforeEach(() => {

    //create an instance of vuetify so we can inject it into 
    //the mounted component, allowing it to behave as it would
    //in a browser
    const vuetify = createVuetify({
      components,
      directives,
    })

    wrapper = mount(InputForm, {
      global: {
        plugins: [vuetify],
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
    expect(wrapper.findAll("#employeeCount").length).toBe(1);
    expect(wrapper.findAll("#startDate").length).toBe(1);
    expect(wrapper.findAll("#endDate").length).toBe(1);
    expect(wrapper.findAll("#comments").length).toBe(1);
    expect(wrapper.find("#csvFile").attributes("type")).toBe("file");
    expect(wrapper.find("#csvFile").attributes("accept")).toBe(".csv");
    
  })

  it('Setting start date causes end date to default to one year later', async () => { 

    const startDateComponent = wrapper.findComponent({ref: 'startDate'})
    const endDateComponent = wrapper.findComponent({ref: 'endDate'})

    const startDate = moment().subtract(1, "years").format("yyyy-MM");
    const expectedEndDate = moment().subtract(1, "months").format("yyyy-MM");
    await startDateComponent.setValue(startDate);
    
    expect(wrapper.vm.$data.startDate).toBe(startDate)
    expect(wrapper.vm.$data.endDate).toBe(expectedEndDate)

  })

})