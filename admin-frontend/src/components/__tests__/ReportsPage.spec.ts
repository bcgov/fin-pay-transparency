import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import ApiService from '../../services/apiService';
import { useReportSearchStore } from '../../store/modules/reportSearchStore';
import ReportsPage from '../ReportsPage.vue';

// Mock the ResizeObserver
const ResizeObserverMock = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Stub blobal objects needed for testing
vi.stubGlobal('ResizeObserver', ResizeObserverMock);
vi.stubGlobal('URL', { createObjectURL: vi.fn() });

describe('ReportsPage', () => {
  let wrapper;
  let pinia;
  let reportSearchStore;

  const initWrapper = async (options: any = {}) => {
    const vuetify = createVuetify({
      components,
      directives,
    });

    pinia = createTestingPinia({
      initialState: {},
    });
    wrapper = mount(ReportsPage, {
      global: {
        plugins: [vuetify, pinia],
      },
    });
    reportSearchStore = useReportSearchStore();

    //wait for the async component to load
    await flushPromises();
  };

  beforeEach(async () => {
    await initWrapper();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('viewReportInNewTab', () => {
    describe('given a valid report id', () => {
      it('downloads the report, and opens it in a new tab or window', async () => {
        const mockReportId = 1;
        const mockPdfAsBlob = new Blob(['mock pdf'], {
          type: 'application/pdf',
        });
        const getPdfReportAsBlobSpy = vi
          .spyOn(ApiService, 'getPdfReportAsBlob')
          .mockResolvedValue(mockPdfAsBlob);
        const windowOpenSpy = vi.spyOn(window, 'open');
        await wrapper.vm.viewReportInNewTab(mockReportId);
        expect(getPdfReportAsBlobSpy).toHaveBeenCalledTimes(1);
        expect(windowOpenSpy).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('isDownloadingPdf', () => {
    describe('given a report id listed in reportsCurrentlyBeingDownloaded ', () => {
      it('downloads the report, and opens it in a new tab or window', async () => {
        const mockReportId1 = '1';
        const mockReportId2 = '2';
        wrapper.vm.reportsCurrentlyBeingDownloaded = {};
        wrapper.vm.reportsCurrentlyBeingDownloaded[mockReportId1] = true;
        expect(wrapper.vm.isDownloadingPdf(mockReportId1)).toBeTruthy();
        expect(wrapper.vm.isDownloadingPdf(mockReportId2)).toBeFalsy();
      });
    });
  });

  describe('setReportDownloadInProgress', () => {
    it('records that the given reportId is being downloaded', async () => {
      const mockReportId1 = '1';
      wrapper.vm.reportsCurrentlyBeingDownloaded = {};
      wrapper.vm.setReportDownloadInProgress(mockReportId1);
      expect(
        wrapper.vm.reportsCurrentlyBeingDownloaded.hasOwnProperty(
          mockReportId1,
        ),
      ).toBeTruthy();
    });
  });

  describe('clearReportDownloadInProgress', () => {
    it('clears the flag indicating the given reportId is being downloaded', async () => {
      const mockReportId1 = '1';
      wrapper.vm.reportsCurrentlyBeingDownloaded = {};
      wrapper.vm.reportsCurrentlyBeingDownloaded[mockReportId1] = true;
      wrapper.vm.clearReportDownloadInProgress(mockReportId1);
      expect(
        wrapper.vm.reportsCurrentlyBeingDownloaded.hasOwnProperty(
          mockReportId1,
        ),
      ).toBeFalsy();
    });
  });

  describe('exportResults', () => {
    it('delegates to reportSearchStore', async () => {
      const downloadReportsCsvSpy = vi
        .spyOn(reportSearchStore, 'downloadReportsCsv')
        .mockResolvedValue();
      wrapper.vm.lastSubmittedReportSearchParams = { filter: [] };
      wrapper.vm.exportResults();
      expect(downloadReportsCsvSpy).toHaveBeenCalledWith(
        wrapper.vm.lastSubmittedReportSearchParams,
      );
    });
  });
});
