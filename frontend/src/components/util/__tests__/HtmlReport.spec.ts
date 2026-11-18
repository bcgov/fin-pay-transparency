import { createTestPlugins } from '../../../test-utils/vuetify';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ApiService from '../../../common/apiService';
import HtmlReport from '../HtmlReport.vue';

describe('HtmlReport', () => {
  let wrapper;

  beforeEach(() => {
    //create an instance of vuetify so we can inject it
    //into the mounted component, allowing it to behave as it would
    //in a browser
    const plugins = createTestPlugins({
      piniaOptions: {
        initialState: {
          //mock the values in the reportStepper store
          reportStepper: { reportId: 'mock-report-id' },
        },
      },
    });

    wrapper = mount(HtmlReport, {
      global: {
        plugins: plugins.plugins,
      },
    });
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('When the report HTML is successfully retrieved from the backend', () => {
    it('The report HTML is shown', async () => {
      const mockReportHtml = '<html></html>';
      vi.spyOn(ApiService, 'getHtmlReport').mockResolvedValue(mockReportHtml);
      await wrapper.vm.loadReport();
      expect(wrapper.vm.reportHtml).toBe(mockReportHtml);
      expect(wrapper.vm.loadReportError).toBeFalsy();
      expect(wrapper.findAll('.report-preview').length).toBe(1);
      expect(wrapper.findAll('.load-report-error').length).toBe(0);
    });
  });
  describe('When the report HTML cannot be retrieved from the backend', () => {
    it('An error is shown', async () => {
      vi.spyOn(ApiService, 'getHtmlReport').mockRejectedValue(new Error());
      await wrapper.vm.loadReport();
      expect(wrapper.vm.reportHtml).toBeUndefined();
      expect(wrapper.vm.loadReportError).toBeTruthy();
      expect(wrapper.findAll('.report-preview').length).toBe(0);
      expect(wrapper.findAll('.load-report-error').length).toBe(1);
    });
  });
});
