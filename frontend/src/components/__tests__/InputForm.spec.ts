import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createVuetify } from "vuetify";
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import InputForm from '../InputForm.vue'


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

})